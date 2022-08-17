const puppeteer = require('puppeteer');
require('dotenv').config();
const nodemailer = require('nodemailer');

const xpathProdName = '//*[@id="lblPrdName"]';
const xpathIsOutOfStock = '//*[@id="lblIsOutOfStock"]';
const productsList = [
    {
        id: "butterMilk8",
        name:"Buttermilk Pack of 8",
        xpath: '//*[@id="ContentPlaceHolder1_Dv_PCatPrdList_IT1_lblCPrdName_1"]',
        selectorID: "#ContentPlaceHolder1_Dv_PCatPrdList_IT1_lblCPrdName_1",
        inStock: false,
    },
    {
        id: "butterMilk30",
        name:"Buttermilk Pack of 30",
        xpath: '//*[@id="ContentPlaceHolder1_Dv_PCatPrdList_IT0_lblCPrdName_0"]',
        selectorID: "#ContentPlaceHolder1_Dv_PCatPrdList_IT0_lblCPrdName_0",
        inStock: false,
    },
    {
        id: "lassi8",
        name:"Lassi Pack of 8",
        xpath: '//*[@id="ContentPlaceHolder1_Dv_PCatPrdList_IT3_lblCPrdName_3"]',
        selectorID: "#ContentPlaceHolder1_Dv_PCatPrdList_IT3_lblCPrdName_3",
        inStock: false,
    }, {
        id: "lassi32",
        name:"Lassi Pack of 32",
        xpath: '//*[@id="ContentPlaceHolder1_Dv_PCatPrdList_IT2_lblCPrdName_2"]',
        selectorID: "#ContentPlaceHolder1_Dv_PCatPrdList_IT2_lblCPrdName_2",
        inStock: false,
    }
]

async function scrapeProteinProduct(url) {

    const browser = await puppeteer.launch({
        headless: true,
        'args' : [
            '--no-sandbox',
            '--disable-setuid-sandbox'
          ]
    });
    const page = await browser.newPage();
    await page.goto(url);
    var shouldMail = false;


    for await (const product of productsList) {
        if (await page.$(product.selectorID) !== null) {
            await navigateTo(page, product.selectorID);
            try {
                let temp = product.inStock;
                product.inStock = await isInStock(page);
                if(temp!=product.inStock && !shouldMail)
                    shouldMail = true
            }
            catch (e) {
                console.log(e)
            }
            await page.goBack();
        }
    };


    console.log("scraping done")
    //if (productsList.some((p) => p.inStock)) { //if at least one product is in stock, new modification send mail in case there is any change in status. dont send mail if no status change
    if (shouldMail) { //if at least one product is in stock, new modification send mail in case there is any change in status. dont send mail if no status change

        await page.screenshot({ path: __dirname + '/screenshot.png', fullPage: true })


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
            subject: 'Amul protein products inventory changed', // Subject line
            html: '<h2 style="color:#ff6600;">Hey! There were some changes in Amul protein products inventory. Have a look!</h2><img src="cid:productList">',
            attachments: [{
                filename: 'screenshot.png',
                path: __dirname + '/screenshot.png',
                cid: 'productList' //same cid value as in the html img src
            }]
        };

        try { //first scrapping will always mail since status is false 
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


    let productRows=""
    productsList.forEach(p=>{
        productRows+=`<tr style="height: 18px;"><td style="width: 50%; height: 18px;">`+p.name+`</td>
        <td style="width: 50%; height: 18px;">`+(p.inStock?'Yes':'No')+`</td></tr>`
    })

    const htmlStr=`<h1 style="color: #5e9ca0;">Welcome to ScrapityCrawl!</h1>
    <h2 style="color: #2e6c80;">Website scrapped:</h2>
    <a href="${amulUrl}" >Amul Protein Products</a>
    <h2 style="color: #2e6c80;">Run frequency :</h2>
    <p>`+intervalMs/60000+` mins</p>
    <h2 style="color: #2e6c80;">Last run was at :</h2>
    <p>`+new Date()+`</p>
    <h2 style="color: #2e6c80;">Product Status:</h2>
    <table style="border-collapse: collapse; width: 100%; height: 90px;" border="1">
    <tbody>
    <tr style="height: 18px;">
    <td style="width: 50%; height: 18px;"><strong>Name</strong></td>
    <td style="width: 50%; height: 18px;"><strong>In stock?</strong></td>
    </tr>${productRows}
    </tbody>
    </table>
    <p style="color: #2e6c80;">When products are in stock you will receive a mail at aars095@gmail.com</p>
    <p>&nbsp;</p>`

    return htmlStr;

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


const http = require('http');
const port = process.env.PORT || 3000;
let lastresp = "";
const intervalMs = 600000; //10mins 600000
const amulUrl= "https://shop.amul.in/WebForms/Web_Dist_Category_PrdList.aspx?DistId=MTExMTExMQ==&PCatId=MQ==&IsDistPrd=VHJ1ZQ==";

const server = http.createServer(async (req, res) => { //when someone hits the browser. if no traffic then heroku will idle
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html');
  res.write(lastresp)
  res.end();
});

server.listen(port,() => {
  console.log(`Server running at port `+port);
  setInterval( async ()=>{
    lastresp = await scrapeProteinProduct(amulUrl)
 }, intervalMs);
});

// 3600000