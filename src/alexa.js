const parse = require('csv-parse');
const fs = require('fs');
const mongoose = require('mongoose');
const path = require('path');

class AlexaController {
  constructor() {
    this.model = mongoose.model(
      'Site',
      new mongoose.Schema({
          id: Number,
          domain: String,
        },
        {
          timestamps: true,
          versionKey: false,
        }),
    );
  }

  async storeSites(file) {
    let count = 0;
    const rows = []
    fs.createReadStream(path.resolve(__dirname,'..', file))
      .pipe(parse())
      .on('data', (csvrow) => {
        count += 1;
        rows.push(this.model.create({
          id: parseInt(csvrow[0]),
          domain: csvrow[1],
        }));
      });
    await Promise.all(rows);
    return count;
  }

  async fetchSites(start, end) {
    return this.model.find({id: {$gte: start, $lt: end}})
      .select('-_id')
      .lean()
      .exec();
  }

  async fetchOne(id) {
    return this.model.findOne({ id })
      .select('-_id')
      .lean()
      .exec();
  }
}

module.exports = AlexaController;
