const mongoose = require('mongoose');

const AlexaController = require('./alexa');
const SSLMateController = require('./sslmate');
const CrtshController = require('./crtsh');

const alexaController = new AlexaController();
const sslMateController = new SSLMateController('30957_ig3vqyFDQh9gtlqNpCoh')
const crtshController = new CrtshController()

mongoose.connect('mongodb://localhost:27017/ct', {
  useNewUrlParser: true,
  // useUnifiedTopology: true
});

/**
 * store sites from csv
 */
// alexaController.storeSites('top-11k-12k.csv').then((count) => {
//   console.log('Done', count, 'imported');
// })

/**
 * fetch certificates with details from crt.sh
 */
// let indexCD = 1000;
// async function work() {
//   if (indexCD < 1) {
//     if (crtshController.queue.length === 0) {
//       console.log('Crst.sh done')
//       return;
//     } else {
//       console.log('Work; queue length', crtshController.queue.length)
//       await crtshController.work();
//     }
//   } else {
//     if (crtshController.queue.length < 20) {
//       console.log('Crt.sh queue size is less than 20; add new tasks');
//       const site = await alexaController.fetchOne(indexCD);
//       indexCD -= 1;
//       try {
//         await crtshController.fetchOne(site.domain);
//       } catch (e) {
//         console.log('Crt.sh ERROR, will re-try later');
//         // console.log(e);
//         indexCD += 1;
//       }
//     } else {
//       console.log('Work; queue length', crtshController.queue.length)
//       await crtshController.work();
//     }
//   }
//   setTimeout(work, 2 * 1000);
// }
// (async () => {
//   await work();
// })();

/**
 * fetch number certificates without details from crt.sh
 */
// todo imrove
// const start = 10001;
// const end = 11000;
// let indexC = start;
// const failedDomains = [];
// async function work() {
//   if (indexC > end) {
//     console.log('Done');
//     console.log(failedDomains);
//     return;
//   }
//   const site = await alexaController.fetchOne(indexC);
//   indexC += 1;
//   try {
//     await crtshController.fetchOneSummary(site.domain);
//   } catch (e) {
//     console.log('Crt.sh ERROR');
//     failedDomains.push(site.domain);
//     // indexC -= 1;
//   }
//   setTimeout(work, 2 * 1000);
// }
//
// (async () => {
//   await work();
// })();

/**
 * fetch certificates with details from SSLMate
 */
const failedDomains= [];
let indexS = 11000;
const sslInterval = setInterval(async () => {
  if (indexS < 10001) {
    clearInterval(sslInterval);
    console.log('SSLMate done')
    const failedInterval = setInterval(async () => {
      if (failedDomains.length === 0) {
        clearInterval(failedInterval);
        console.log('SSLMate retry done');
        console.log(failedDomains);
        return;
      }
      console.log('SSLMate re-try these', failedDomains);
      const domain = failedDomains.shift();
      try {
        await sslMateController.fetchOne(domain);
      } catch (e) {
        console.log('SSLMate ERROR');
        failedDomains.push(domain);
      }
    }, 40 * 1000) // 6 * 60 * 1000 if you are free plan
    return;
  }
  const site = await alexaController.fetchOne(indexS);
  indexS -= 1;
  try {
    await sslMateController.fetchOne(site.domain);
  } catch (e) {
    console.log('SSLMate ERROR');
    failedDomains.push(site.domain);
  }
}, 40 * 1000); // 6 * 60 * 1000 if you are free plan

// const failedDomains = [
//   'n1.ru',
//   'nbastreams.cc',
//   'sakh.com',         'veridyen.com',
//   '24open.ru',        'betcity.ru',
//   'videocyborg.com',  'mightytext.net',
//   'arsenal.com',      'shopathome.com',
//   'cv-library.co.uk', 'brixly.uk',
//   'brainberries.co',  'sonetel.com',
//   'srail.kr',         'tindie.com',
//   'pcfactory.cl',     'gofounders.net',
//   'biblio.com',       'sms.ir',
//   'identityiq.com',   'freepngimg.com',
//   'avto.net',         'royalsupreme.cn',
//   'google.com.bh',    'gamepro.de',
//   'fat-anal.com',      'zendesk.com',
//   'namu.wiki',
//   'tsetmc.com',
//   'amazon.it',
//   'fiverr.com',
//   'evernote.com'
// ];
//
// async function work() {
//   const domain = failedDomains.shift();
//   try {
//     await crtshController.fetchOneSummary(domain);
//   } catch (e) {
//     console.log('Crt.sh ERROR');
//     failedDomains.push(domain);
//     console.log(failedDomains);
//   }
//   setTimeout(work, 2 * 1000);
// }
//
// (async () => {
//   await work();
// })();