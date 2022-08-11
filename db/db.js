'use strict';

const fs = require('fs');

module.exports = {
  find: function (table, id) {
    let rawdata = fs.readFileSync('db/'+table+'.json');
    let jsondata = JSON.parse(rawdata);
    for (var i=0; i<jsondata.length; i++) {
      if (jsondata[i].id && jsondata[i].id == id) return jsondata[i];
    }
    return null;
  },
  update: function (table, obj) {
    let rawdata = fs.readFileSync('db/'+table+'.json');
    let data = JSON.parse(rawdata);
    var last_id = 0;
    for (var i=0; i<data.length; i++) {
      if (data[i].id && data[i].id == obj.id) {
        for (var iKey in obj) {
          data[i][iKey] = obj[iKey];
        }
      }
      if (data[i].id && data[i].id > last_id) last_id = parseInt(data[i].id);
    }
    if (!obj.id) {
      obj.id = last_id+1;
      data.push(obj);
    }
    fs.writeFileSync('db/'+table+'.json', JSON.stringify(data, null, 2));
  },
  remove: function (table, id) {
    let rawdata = fs.readFileSync('db/'+table+'.json');
    let data = JSON.parse(rawdata);
    data = data.filter(item => item.id != id);
    fs.writeFileSync('db/'+table+'.json', JSON.stringify(data, null, 2));
  },
  load: function (table) {
    let rawdata = fs.readFileSync('db/'+table+'.json');
    let jsondata = JSON.parse(rawdata);
    return jsondata;
  },
  store: function (table, data) {
    console.log("xxxxx", data);
    var last_id = 0;
    for (var i=0; i<data.length; i++) {
      if (data[i].id && data[i].id > last_id) last_id = parseInt(data[i].id);
    }

    for (var j=0; j<data.length; j++) {
      if (!data[j].id) {
        data[j].id = last_id+1;
        last_id ++;
      }
    }

    let rawdata = JSON.stringify(data, null, 2);
    fs.writeFileSync('db/'+table+'.json', rawdata);
  }
}