const mongoose = require('mongoose');
const axois = require('axios');

class SSLMateController {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.model = mongoose.model(
      'SSLMate',
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
  }

  async fetchOne(domain) {
    const { data } = await axois.get(`https://api.certspotter.com/v1/issuances?domain=${domain}&match_wildcards=true&include_subdomains=true&expand=dns_names&expand=issuer&expand=cert`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });
    console.log('SSLMate fetched', data.length, 'records of', domain);
    data.forEach((record) => {
      this.model.create({
        id: record.id,
        searchDomain: domain,
        notBefore: Date.parse(record.not_before),
        notAfter: Date.parse(record.not_after),
        issuer: record.issuer.name,
        serialNumber: record.id,
        dnsNames: record.dns_names,
        cert: {
          type: record.cert.type,
          sha256: record.cert.sha256,
        }
      });
      // this.model.updateOne( {
      //   id: record.id,
      // },{
      //   id: record.id,
      //   searchDomain: domain,
      //   notBefore: Date.parse(record.not_before),
      //   notAfter: Date.parse(record.not_after),
      //   issuer: record.issuer.name,
      //   serialNumber: record.id,
      //   dnsNames: record.dns_names,
      //   cert: {
      //     type: record.cert.type,
      //     sha256: record.cert.sha256,
      //   }
      // }, {
      //   upsert: true,
      // });
    })
  }

  async get(domain) {
    this.model.find({
      searchDomain: domain,
    })
      .exec();
  }
}

module.exports = SSLMateController;