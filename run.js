require('./env.js');
var creds = require('./google-credentials.json');
var request = require('request');
var GoogleSpreadsheet = require('google-spreadsheet');

// Make new spreadsheet object with spreadsheet key
var spreadsheet = new GoogleSpreadsheet(SPREADSHEET_KEY);

// Build request URL for openweathermap.com
var openWeatherURL = 'http://api.openweathermap.org/data/2.5/weather?id=5949568&units=metric'
	+ '&appid=' + API_KEY;
var discoverEstevanURL = 'http://www.discoverestevan.com//weather';

function insertIntoSpreadsheet(data, callback) {
	// Authorize with Google
	spreadsheet.useServiceAccountAuth(creds, function(error){
		if (error) {callback(error);}
		// Insert data into spreadsheet
		spreadsheet.addRow(1, data, function(error) {
			if (error) {callback(error);}
			// Callback wiht no errors
			callback(null);
		});
	});
}

function getOpenWeatherData(callback) {
	// Get temp data from openweathermap
	request(openWeatherURL, function (error, response, body) {
		if (error) throw error;
		// Make sure request was successful before doing anything
		if (response.statusCode == 200) {
			// Convert JSON into something we can use
			body = JSON.parse(body);
			// Callback with temp data
			callback(null, body.main.temp);
		}
		else {
			// Callback with error
			callback("Error fetching open weather data");
		}
	});
}

function getDiscoverEstevanData(callback) {
	request(discoverEstevanURL, function(error, response, body) {
		if (error) throw error;
		// Make sure request was successful before doing anything
		if (response.statusCode == 200) {
			// Extract the temperature from html
			var n = body.search('"temperature"');
			var result = body.substring(n + 16);
			result = result.split('&deg');
			result = result[0].trim();
			// Check to make sure it is what we wanted
			if (result.search('[a-z]') === -1) {
				// Callback with resulting temperature
				callback(null, result);
			}
			else {
				// Callback with error
				callback("Result not a number");
			}
		}
		else {
			// Callback with error
			callback("Error fetching discover Estevan data");
		}
	});
}

function createRow(date_time, openWeatherData, discoverEstevanData, callback) {
	// Create row object to insert
	var newRow = {time: date_time, openweatherapi: openWeatherData, discoverestevan: discoverEstevanData};
	callback(null, newRow);
}

function getTime(callback) {
	// Build the date/time for insertion
	var dateObj = new Date();
	
	// Make sure time is in UTC time
	dateObj.setTime( dateObj.getTime() + dateObj.getTimezoneOffset() * 60 * 1000 );
	
	// Convert it to the America/Regina time zone (UTC - 6:00) No DST ever
	// -6 hours * 60 minutes/hour * 60 seconds/minute * 1000 miliseconds/second
	dateObj.setTime( dateObj.getTime() + -6 * 60 * 60 * 1000);
	
	// Change our dateObj into something we can put in the spreadsheet
	var date = dateObj.getFullYear() + "-" + (dateObj.getMonth() + 1) + "-" + dateObj.getDate() + " ";
	var time = dateObj.getHours() >= 10 ? dateObj.getHours() : "0" + dateObj.getHours();
	time += ":";
	time += dateObj.getMinutes() >= 10 ? dateObj.getMinutes() : "0" + dateObj.getMinutes();
	time += ":";
	time += dateObj.getSeconds() >= 10 ? dateObj.getSeconds() : "0" + dateObj.getSeconds();
	
	callback(null, date + time);
}


getDiscoverEstevanData(function(error, discoverEstevanResult) {
	getOpenWeatherData(function(error, openWeatherResult) {
		getTime(function(error, date_time) {
			createRow(date_time, openWeatherResult, discoverEstevanResult, function(error, newRow) {
				insertIntoSpreadsheet(newRow, function(error) {
					if (error) throw error;
					console.log('Successfully inserted Row');
				});
			});
		});
	});
});