const fs = require('fs');
const assert = require('assert');
const path  = require('path');

const { specification, dropNull, getInsightViews } = require('../lib/build/bundle');

const datasetPath = path.resolve(__dirname, './dataset/airbnb.json');
const dataset = JSON.parse(fs.readFileSync(datasetPath).toString());
const {
  dataSource,
  config: {
    Dimensions: dimensions,
    Measures: measures
  }
} = dataset;
let cleanData = dropNull(dataSource, dimensions, measures);

describe('insights test', function () {

  it('print(getInsightViews)', function () {
    let result = getInsightViews(cleanData, dimensions, measures);
    // console.log(result)
    for (let report of result) {
      const dimList = report.detail[0];
      for (let meaList of report.groups) {
        const { schema, aggData } = specification(cleanData, dimList, meaList);
        console.log(schema);
        assert.equal(Object.keys(schema).length > 0, true); 
      }
      // for (let [element, size] of visualElements) {
      //   if (typeof schema[element] !== 'undefined') {
      //     assert.equal(schema[element].length <= size, true);
      //   }
      // }
    }
    assert.equal(result.length > 0, true);
  })
})

