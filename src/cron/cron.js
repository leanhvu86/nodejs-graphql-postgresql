import {request} from 'graphql-request'
import Sequelize from 'sequelize';

const fetch = require("node-fetch");

// connectori su orm mapiranja, a resolveri su orm upiti mapiranja na graphql
// Group, Message, User sequelize modeli tabele
//


const mstoreUrl = 'http://demo.nextsolutions.com.vn:3001/mstore';

const Op = Sequelize.Op;
const riotUrl = 'http://demo.nextsolutions.com.vn:3001/riot';

const MESSAGE_CREATED = "Testmessage";
const CronJob = require('cron').CronJob;


export const cronGetVoucherFromMstoreApp = function () {

    async function getData(url = '', data = {}) {
        // Default options are marked with *
        const response = await fetch(url, {
            method: 'GET', // *GET, POST, PUT, DELETE, etc.
            mode: 'cors', // no-cors, *cors, same-origin
            cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
            credentials: 'same-origin', // include, *same-origin, omit

            headers: {

                'Content-Type': 'application/json',
                "Authorization": "Bearer 556f621a-5c0d-489f-9c15-9325427f1a4e",
                "Accept-Language": "1"
                // 'Content-Type': 'application/x-www-form-urlencoded',
            }
        });
        return response.json(); // parses JSON response into native JavaScript objects
    }

    const query = `
                    mutation {
                      deleteFile(
                        id : 52
                        user_id: 100
                      ) {
                        id,
                        file_name,
                        file_type,
                        status,
                        file_url,
                        owner_id,
                        createdAt
                      
                      }
                    }`
    const queryCreateVoucher = `
    
    
    
    
    `

    let job = new CronJob('0 */10000 * * * *', function () {
        return getData("http://dev.nextsolutions.com.vn:8234/api/v1/incentive/getCouponCode?merchantId=14181", {
            username: 'dsfe',
            password: 'none',
            token: 'dfdfe'
        }).then(data => {
            let coupon;
            let couponIncentives = [];
            for (coupon in data){
                let couponObject = {
                    id : data[coupon].id,
                    incentiveProgramId:  data[coupon].incentiveProgramId,
                    code:  data[coupon].code,
                    requiredMinimumAmount:  data[coupon].requiredMinimumAmount,
                    limitedQuantity:  data[coupon].limitedQuantity,
                    discountPercent: data[coupon].discountPercent,
                    discountPrice: data[coupon].discountPrice,
                    limitedPrice: data[coupon].limitedPrice,
                    incentiveName: data[coupon].incentiveName,
                    // incentiveDescription:  data[coupon].incentiveDescription,
                    shortDescription:  data[coupon].shortDescription,
                    fromDate:  data[coupon].fromDate,
                    toDate:  data[coupon].toDate,
                    packingCode: data[coupon].packingCode,
                    quantity:  data[coupon].quantity
                };
                couponIncentives.push(couponObject);

            }

            console.log(JSON.stringify(couponIncentives))
        })
        console.log('You will see this message every second');
        request('http://localhost:5000', query).then((data) => console.log(data))

    }, null, true, 'Asia/Ho_Chi_Minh');
    job.start();
};