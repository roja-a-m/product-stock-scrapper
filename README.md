# product-stock-scrapper
This is a nodejs web scrapper which checks whether a certain products are in stock on Amul website and notifies me via mail.  

https://shop.amul.in/WebForms/Web_Dist_Category_PrdList.aspx?DistId=MTExMTExMQ==&PCatId=MQ==&IsDistPrd=VHJ1ZQ==#

The script runs every 10mins on Heroku. Puppeteer is used for web scrapping and nodemailer for emailing.

Script is running on Heroku with basic UI showing basic details. 
https://scrapitycrawl.herokuapp.com/

Since the free version of Heroku is being used, the app may be down due to compulsory 6hrs downtime by Heroku.

To run the script:
npm start

Screenshot of app on Heroku:
![Alt text](https://user-images.githubusercontent.com/48675452/183458798-025bfdc5-c46d-4303-8b27-62a54084cea5.png?raw=true "Heroku App")

Screenshot of email received:
![Alt text](https://user-images.githubusercontent.com/48675452/183454875-72461301-c1a2-444a-a2b3-ad1a1e9d9d67.jpeg?raw=true "Screenshot of Email Received")
