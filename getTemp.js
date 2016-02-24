require('./env.js');
var creds = require('./google-credentials.json');
var request = require('request');
var GoogleSpreadsheet = require('google-spreadsheet');

// Make new spreadsheet object with spreadsheet key
var spreadsheet = new GoogleSpreadsheet(SPREADSHEET_KEY);

// Build request URL for openweathermap.com
var requestURL = 'http://api.openweathermap.org/data/2.5/weather?id=5949568&units=metric'
	+ '&appid=' + API_KEY;

// The good stuff
// Authorize with google
spreadsheet.useServiceAccountAuth(creds, function(err){
	if (err) throw err;
	// Get temp data from openweathermap
	request(requestURL, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			// Convert JSON into something we can use
			body = JSON.parse(body);
			
			// Build new row object to insert into sheet
			var dateObj = new Date();
			var date = (dateObj.getMonth() + 1) + "/" + dateObj.getDate() + "/" + dateObj.getFullYear() + " ";
			var time = dateObj.getHours() > 10 ? dateObj.getHours() : "0" + dateObj.getHours();
			time += ":";
			time += dateObj.getMinutes() > 10 ? dateObj.getMinutes() : "0" + dateObj.getMinutes();
			time += ":";
			time += dateObj.getSeconds() > 10 ? dateObj.getSeconds() : "0" + dateObj.getSeconds();
			
			var newRow = {time: date + time, tempc: body.main.temp};
			console.log(newRow);
			spreadsheet.addRow(1, newRow, function(err) {
				if (!err) {
					console.log("Row added successfully!");
				}
			});
		}
		else {
			console.log("Error fetching weather data");
		}
	});
});