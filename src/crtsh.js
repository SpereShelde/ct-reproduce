const mongoose = require('mongoose');
const axois = require('axios');
const cheerio = require('cheerio');

class CrtshController {
  constructor() {
    this.model = mongoose.model(
      'Crtsh',
      new mongoose.Schema({
          id: Number,
          searchDomain: String,
          notBefore: Date,
          notAfter: Date,
          issuer: String,
          serialNumber: String,
          dnsNames: Array,
          cert: Object,
        },
        {
          timestamps: true,
          versionKey: false,
        }),
    );
    this.summaryModel = mongoose.model(
      'CrtSummary',
      new mongoose.Schema({
          domain: String,
          number: Number,
        },
        {
          timestamps: false,
          versionKey: false,
        }),
    );
    this.queue = [];
  }

  async work() {
    if (this.queue.length === 0) {
      return;
    }
    const incptRecord = this.queue.shift();
    try {
      const record = await this.fetchDetail(incptRecord);
      // await this.model.create(record);
      await this.model.updateOne( { id: record.id }, record, { upsert: true });
    } catch (e) {
      console.log('Crt.sh ERROR');
      this.queue.push(incptRecord);
    }
  }

  async fetchDetail(incompleteRecord) {
    const { data } = await axois.get(`https://crt.sh/?id=${incompleteRecord.id}`);
    const $ = cheerio.load(data);
    const record = {
      ...incompleteRecord
    };
    record.cert = {
      type: $('body > table:nth-child(7) > tbody > tr:nth-child(2) > td').text(),
      sha256: $('body > table:nth-child(7) > tbody > tr:nth-child(5) > td > table > tbody > tr > td:nth-child(2) > a').text(),
    };
    const rawSerialNumber = $('body > table:nth-child(7) > tbody > tr:nth-child(6) > td > a:nth-child(5)').attr('href');
    record.serialNumber = rawSerialNumber.substring(8, rawSerialNumber.length);
    return record;
  }

  async fetchOne(domain) {
    const { data } = await axois.get(`https://crt.sh/?Identity=${domain}&exclude=expired&deduplicate=Y`);
    const $ = cheerio.load(data);
    const length = $('body > table:nth-child(8) > tbody > tr > td > table > tbody tr').length;
    if (length <= 0) {
      return;
    }
    console.log('Crt.sh fetched', length - 1, 'records of', domain);
    for (let i = 2; i <= length; i += 1) {
      this.queue.push({
        searchDomain: domain,
        id: $(`body > table:nth-child(8) > tbody > tr > td > table > tbody > tr:nth-child(${i}) > td:nth-child(1) > a`).text(),
        issuer: $(`body > table:nth-child(8) > tbody > tr > td > table > tbody > tr:nth-child(${i}) > td:nth-child(6) > a`).text(),
        notBefore: Date.parse($(`body > table:nth-child(8) > tbody > tr > td > table > tbody > tr:nth-child(${i}) > td:nth-child(3)`).text()),
        notAfter: Date.parse($(`body > table:nth-child(8) > tbody > tr > td > table > tbody > tr:nth-child(${i}) > td:nth-child(4)`).text()),
        dnsNames: $(`body > table:nth-child(8) > tbody > tr > td > table > tbody > tr:nth-child(${i}) > td:nth-child(5)`).html().split('<br>'),
      });
    }
  }

  async fetchOneSummary(domain) {
    const { data } = await axois.get(`https://crt.sh/?Identity=${domain}&exclude=expired&deduplicate=Y`);
    const $ = cheerio.load(data);
    const length = $('body > table:nth-child(8) > tbody > tr > td > table > tbody tr').length;
    console.log('Crt.sh fetched', Math.max(0, length - 1), 'records of', domain);
    await this.summaryModel.create({
      domain,
      number: Math.max(0, length - 1),
    })
  }

  async get(domain) {
    this.model.find({
      domain
    })
      .exec();
  }

  async getSummary(domain) {
    this.summaryModel.find({
      domain
    })
      .exec();
  }
}

module.exports = CrtshController;