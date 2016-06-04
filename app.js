var _ = require('lodash');
var clean = function(x) {
    return x.replace(/(\r\n|\n|\r)/gm,"").trim();;
};

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}


var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();

app.use(express.static('public'));
app.use(express.static('build'));
app.use('/images', express.static('images'));
app.use('/fonts', express.static('fonts'));

app.use('/js', express.static('js'));

var timeout = 5000;

var allframes = [];

var writeframes = _.debounce(function(){
    fs.writeFile("frames.json", JSON.stringify(allframes))
},500);

frame_krol = function(url, cb) {
    console.log('.')
    request({url:url,timeout:timeout}, function(error, response, html){
        if(!error) {
            var data = {};
	    var $ = cheerio.load(html);
            var frames = [];
            var text = $('.description').text()
	    var money = $('.money').text()
	    var img = $('#product-gallery').find('img').attr('src');
	    var title = $('#product-header-title h1').text();
	    allframes.push({type:'njs', money: money, text:text, img: img, url:url, title});
	    writeframes();
	    
            cb(text,money);
        }
        else {
            console.log('**** Error', url, error);
	    cb('','')
        }
    });
}

njs_krol = function(term, page, cb) {
    var url = 'https://www.njs-export.com/collections/frames?page=' + page;
    request({url:url,timeout:timeout}, function(error, response, html){
        if(!error) {
            var data = {};
            console.time('njs_find');
	    var $ = cheerio.load(html);
            var frames = [];
            $('.product-grid-item').each(
                function(i,frame){
		    var link = 'https://www.njs-export.com' + $(frame).find('a').attr('href');
		    frames.push(link)
		}
            );

	    var doit = function(cursor, frames) {
		var link = frames[cursor];
		if (!link) {
		    return;
		}
		frame_krol(link, function(t,m){
		    if (t.match(term)) {
			console.log('*******************')
			console.log(link, m)
			console.log('*******************')
		    }
		    doit(cursor + 1, frames);
		})
	    };

	    doit(0, frames);
	    
	    console.timeEnd('njs_find');
	    console.log('njs_results', frames.length);
            cb(frames);
        }
        else {
            console.log(error, page);
        }
    });
}

/*njs_krol(/.seat tube.5[4-6]([^]*?)top tube.5[2-3]/gim,null,function(r){
//    console.log('res', r)
})*/

for (var p = 1; p < 6; p++) {
    njs_krol(/.seat tube.5[3-5]([^]*?)(^(?!.*dent))/gim,p,function(r){
	//    console.log('res', r)
    })
}


pilframe_krol = function(url, cb) {
    console.log('.')
    request({url:url,timeout:timeout}, function(error, response, html){
        if(!error) {
            var data = {};
	    var $ = cheerio.load(html);
            var frames = [];
            var text = $('.product-description').text()
	    var money = $('#content .product .product-meta .price').text()
	    var img = $('.product-photos').find('img').attr('src');
	    var title = $('.product-form .section-header h2').text();
            cb(text,money);
	    allframes.push({type:'pilgrim', money: money, text:text, img: img, url:url, title});
	    writeframes();
        }
        else {
            console.log('**** Error', url, error);
	    cb('','')
        }
    });
}

pilgrim_krol = function(term, page, cb) {
    var url = 'http://www.8pilgrim8.com/products/track-bike-frame?page=' + page;
    request({url:url,timeout:timeout}, function(error, response, html){
        if(!error) {
            var data = {};
            console.time('njs_find');
	    var $ = cheerio.load(html);
            var frames = [];
            $('.product-thumb').each(
                function(i,frame){
		    var link = 'http://www.8pilgrim8.com' + $(frame).find('a').attr('href');
		    frames.push(link)
		}
            );

	    var doit = function(cursor, frames) {
		var link = frames[cursor];
		if (!link) {
		    return;
		}
		pilframe_krol(link, function(t,m){
		    if (t.match(term)) {
			console.log('*******************')
			console.log(link, m)
			console.log('*******************')
		    }
		    doit(cursor + 1, frames);
		})
	    };

	    doit(0, frames);
	    
	    console.timeEnd('njs_find');
	    console.log('njs_results', frames.length);
            cb(frames);
        }
        else {
            console.log(error, page);
        }
    });
}

/*pilgrim_krol(/.seat.tube..C.T..5[4-5].([^]*?)top.tube..C-C..5[2-4]([^]*?)no dent/gim,null,function(r){
//    console.log('res', r)
})*/

/*pilgrim_krol(/.seat.tube..C.T..5[3-5]([^]*?)no dent/gim,null,function(r){
//    console.log('res', r)
})*/

for (var p = 1; p < 6; p++) {
    pilgrim_krol(/.seat.tube..C.T..5[3-5]([^]*?)no\sdent/gim,p,function(r){
	//    console.log('res', r)
    })
}


var njs = [
    {name: 'njsexport', f: njs_krol}
];

_.each(njs, function(x){
    console.log('registring', '/' + x.name);
    app.get('/' + x.name, function(req, res) {
	console.log(new Date(), '/' + x.name, req.query);
	try {
	    x.f(null,null, function(r){
		res.json(r);	    
	    })
	}
	catch(ex) {
	    console.error('error_' + x.name, ex.message, ex);
	    res.json({});
	}
    });

})


app.get('*', function(req, res){
    res.sendFile('./index.html', { root : __dirname});
});


app.listen(process.env.PORT || 8082);
console.log('Magic happens on port ' + (process.env.PORT || 8082));
exports = module.exports = app;
