require('./env.js');
var creds = require('./google-credentials.json');
var request = require('request');
var GoogleSpreadsheet = require('google-spreadsheet');

// Make new spreadsheet object with spreadsheet key
var spreadsheet = new GoogleSpreadsheet(SPREADSHEET_KEY);

// Build request URL for openweathermap.com
var requestURL = 'http://api.openweathermap.org/data/2.5/weather?id=5949568&units=metric'
	+ '&appid=' + API_KEY;

// Authorize with google
spreadsheet.useServiceAccountAuth(creds, function(error){
	if (error) throw error;
	// Get temp data from openweathermap
	request(requestURL, function (error, response, body) {
		if (error) throw error;
		if (response.statusCode == 200) {
			// Convert JSON into something we can use
			body = JSON.parse(body);
			
			// Build the date/time for insertion
			var dateObj = new Date();
			
			// Make sure time is in UTC time
			dateObj.setTime( dateObj.getTime() + dateObj.getTimezoneOffset() * 60 * 1000 );
			
			// Convert it to the America/Regina time zone (UTC - 6:00) No DST ever
			// -6 hours * 60 minutes/hour * 60 seconds/minute * 1000 miliseconds/second
			dateObj.setTime( dateObj.getTime() + -6 * 60 * 60 * 1000);
			
			// Change our dateObj into something we can put in the spreadsheet
			var date = (dateObj.getMonth() + 1) + "/" + dateObj.getDate() + "/" + dateObj.getFullYear() + " ";
			var time = dateObj.getHours() >= 10 ? dateObj.getHours() : "0" + dateObj.getHours();
			time += ":";
			time += dateObj.getMinutes() >= 10 ? dateObj.getMinutes() : "0" + dateObj.getMinutes();
			time += ":";
			time += dateObj.getSeconds() >= 10 ? dateObj.getSeconds() : "0" + dateObj.getSeconds();
			
			// Create row object to insert
			var newRow = {time: date + time, tempc: body.main.temp};
			console.log(newRow);
			
			// Insert data into spreadsheet
			spreadsheet.addRow(1, newRow, function(error) {
				if (error) throw error;
				console.log("Row added successfully!");
			});
		}
		else {
			throw "Error fetching weather data";
		}
	});
});