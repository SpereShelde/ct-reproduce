const mongoose = require('mongoose');
const AlexaController = require('./alexa');
const SSLMateController = require('./sslmate');
const CrtshController = require('./crtsh');

mongoose.connect('mongodb://localhost:27017/ct', {
  useNewUrlParser: true,
  // useUnifiedTopology: true
});

const alexaController = new AlexaController();
const sslMateController = new SSLMateController('30957_ig3vqyFDQh9gtlqNpCoh');
const crtshController = new CrtshController();

RecordsModel = mongoose.model(
  'record',
  new mongoose.Schema({
      domain: String,
      sslmate: Number,
      crtsh: Number,
    },
    {
      timestamps: false,
      versionKey: false,
    }),
);

alexaController.fetchSites(10001, 11000).then(async (sites) => {
  await Promise.all(sites.map(async (site) => {
    const sslLogs = await sslMateController.model.find({searchDomain: site.domain}).exec();
    const crtlog = await crtshController.summaryModel.findOne({ domain: site.domain }).exec();
    await RecordsModel.create({
      domain: site.domain,
      sslmate: sslLogs.length,
      crtsh: crtlog.number,
    })
  }))
  console.log('Done');
});

// (async () => {
//   const sslLogs = await sslMateController.model.find({searchDomain: 'postermywall.com'}).exec();
//   console.log(sslLogs);
// })();