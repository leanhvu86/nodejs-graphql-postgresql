//
// import {request, gql} from 'graphql-request'
//
// const MESSAGE_CREATED = "Testmessage";
// const CronJob = require('cron').CronJob;
//
//
// export const cronGetVoucherFromMstoreApp = function () {
//     console.log('xxxxxxxxxxxxxxxxxxxxx')
//     const query = `
// mutation {
//   deleteFile(
//     id : 52
//     user_id: 100
//   ) {
//     id,
//     file_name,
//     file_type,
//     status,
//     file_url,
//     owner_id,
//     createdAt
//
//   }
// }`
//
//     let job = new CronJob('0 */1 * * * *', function () {
//         console.log('You will see this message every second');
//         request('http://localhost:5000', query).then((data) => console.log(data))
//
//     }, null, true, 'Asia/Ho_Chi_Minh');
//     job.start();
// };