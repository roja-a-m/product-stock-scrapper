const puppeteer = require('puppeteer');
require('dotenv').config();
const nodemailer = require('nodemailer');

const xpathProdName = '//*[@id="lblPrdName"]';
const xpathIsOutOfStock = '//*[@id="lblIsOutOfStock"]';

async function scrapeProteinProduct(url) {
    const productsList = [
        {
            id: "butterMilk8",
            xpath: '//*[@id="ContentPlaceHolder1_Dv_PCatPrdList_IT1_lblCPrdName_1"]',
            selectorID: "#ContentPlaceHolder1_Dv_PCatPrdList_IT1_lblCPrdName_1",
            inStock: false,
        },
        {
            id: "butterMilk30",
            xpath: '//*[@id="ContentPlaceHolder1_Dv_PCatPrdList_IT0_lblCPrdName_0"]',
            selectorID: "#ContentPlaceHolder1_Dv_PCatPrdList_IT0_lblCPrdName_0",
            inStock: false,
        },
        {
            id: "lassi8",
            xpath: '//*[@id="ContentPlaceHolder1_Dv_PCatPrdList_IT3_lblCPrdName_3"]',
            selectorID: "#ContentPlaceHolder1_Dv_PCatPrdList_IT3_lblCPrdName_3",
            inStock: false,
        }, {
            id: "lassi32",
            xpath: '//*[@id="ContentPlaceHolder1_Dv_PCatPrdList_IT2_lblCPrdName_2"]',
            selectorID: "#ContentPlaceHolder1_Dv_PCatPrdList_IT2_lblCPrdName_2",
            inStock: false,
        }
    ]

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);


    for await (const product of productsList) {
        await navigateTo(page, product.selectorID);
        try {
            product.inStock = await isInStock(page);
        }
        catch (e) {
            console.log(e)
        }
        await page.goBack();
    };


    console.log("scraping done")
    if (productsList.some((p) => p.inStock)) { //if at least one product is in stock

        await page.screenshot({ path: __dirname + 'screenshot.png', fullPage: true })


        let transport = nodemailer.createTransport({
            // host: 'smtp.gmail.io',
            service: 'gmail',
            port: 2525,
            auth: {
                user: "scrapitycrawl",
                pass: "xgyjhthcyuxmrheg"
            }
        });


        const mailOptions = {
            from: 'scrapitycrawl@gmail.com', // Sender address
            to: 'aars095@gmail.com', // List of recipients
            subject: 'Amul protein products are in stock', // Subject line
            html: '<h2 style="color:#ff6600;">Hey! One/Some of the Amul products are back in stock!</h2><img src="cid:productList">',
            attachments: [{
                filename: 'screenshot.png',
                path: __dirname + '/screenshot.png',
                cid: 'productList' //same cid value as in the html img src
            }]
        };

        try {
            transport.sendMail(mailOptions, function (err, info) {
                if (err) {
                    console.log(err)
                } else {
                    console.log(info);
                }
            });

        }
        catch (e) {
            console.log(e)
        }

    }

    browser.close();


}

async function navigateTo(page, buttonID) {
    await Promise.all([
        page.click(buttonID),
        page.waitForNavigation()
    ]);
}

async function isInStock(page) {
    await page.waitForXPath(xpathProdName);
    const [el] = await page.$x(xpathIsOutOfStock);
    const isInStock = await el.getProperty('textContent');
    const isInStockFlag = await isInStock.jsonValue();

    if (isInStockFlag.toLowerCase() === 'true') {
        return false
    }
    else {
        return true;
    }
}

async function isVisible(page, selector) {
    return await page.evaluate((selector) => {
        var e = document.querySelector(selector);
        if (e) {
            var style = window.getComputedStyle(e);

            return style && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
        }
        else {
            return false;
        }
    }, selector);
}


// scrapeProteinProduct('https://shop.amul.in/WebForms/Web_Dist_Category_PrdList.aspx?DistId=MTExMTExMQ==&PCatId=MQ==&IsDistPrd=VHJ1ZQ==')



// 43200000
const http = require('http');
const port = process.env.PORT || 3000

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html');
  res.end('<h1>Hello World</h1>');
});

server.listen(port,() => {
  console.log(`Server running at port `+port);
  setInterval( async ()=>{
    await scrapeProteinProduct('https://shop.amul.in/WebForms/Web_Dist_Category_PrdList.aspx?DistId=MTExMTExMQ==&PCatId=MQ==&IsDistPrd=VHJ1ZQ==')
 }, 60000);
});