const express = require('express');
const session = require('express-session');
var cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
var mailer = require('nodemailer');
const cron = require('node-cron');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const {find, load, store, update, remove} = require("./db/db.js");

const port = process.env.PORT || 3000;

var transporter = mailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'joblistx@gmail.eu',
        pass: 'Sydney999999+'
    }
});

app.use(cookieParser());
app.use(session({secret: 'ssshhhhh',saveUninitialized: true,resave: true}));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
// express routing
app.use(express.static('public'));

var task = cron.schedule('0 8 * * *', function() {
    console.log('running a task every day');
    var data = load("mail");
    var emails = [];
    data.forEach(function(val){
        emails.push(val.mail);
    });

    var html = generate_expired_order_list();

    var mailOptions = {
        from: 'joblistx@networkhero.eu',
        to: emails.join(),
        subject: 'Sending Expired Orders from JoblisteX',
        html: html
    };
      
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
});

app.all('/', function(req, res, next) {
    sess = req.session;
    if(sess.email) {
        res.redirect('/dashboard');
    } else res.sendFile('index.html');
});

app.all('/login', function(req, res, next) {
    var ret = load("user");
    var success = false;
    for (var i=0; i<ret.length; i++) {
        var user = ret[i];
        if (user.email == req.body.email && user.password == req.body.password) {
            req.session.email = req.body.email;
            res.cookie('role', ret[i].role, { maxAge: 900000000, httpOnly: false});
            res.redirect('/dashboard');
            success = true;
            break;
        }
    }
    if (!success) res.redirect('/');
});

app.all('/logout', function(req, res, next) {
    req.session.destroy((err) => {
        if(err) {
            return console.log(err);
        }
        res.redirect('/');
    });
});

app.get('/register', function(req, res, next) {
    res.sendFile('register.html', { root: __dirname + '/public' });
});

app.get('/reset', function(req, res, next) {
    res.sendFile('reset.html', { root: __dirname + '/public' });
});

app.put('/reset', function(req, res, next) {
    var user = find('user', req.query.id);
    if (user.password == req.query.old) {
        user.password = req.query.new;
        update('user', user);
        res.send(user);
    } else {
        res.status(500).send('error');
    }
});

app.all('/dashboard', function(req, res, next) {
    sess = req.session;
    if(sess.email) {
        res.sendFile('dashboard.html', { root: __dirname + '/public' });
    } else res.redirect('/');
});

app.all('/users', function(req, res, next) {
    sess = req.session;
    console.log(sess.email);
    if(sess.email) {
        res.sendFile('users.html', { root: __dirname + '/public' });
    } else res.redirect('/');
});

app.all('/timesheets', function(req, res, next) {
    sess = req.session;
    if(sess.email) {
        res.sendFile('timesheets.html', { root: __dirname + '/public' });
    } else res.redirect('/');
});

app.all('/FAQ', function(req, res, next) {
    sess = req.session;
    if(sess.email) {
        res.sendFile('FAQ.html', { root: __dirname + '/public' });
    } else res.redirect('/');
});

app.all('/email', function(req, res, next) {
    sess = req.session;
    if(sess.email) {
        res.sendFile('email.html', { root: __dirname + '/public' });
    } else res.redirect('/');
});

app.get('/process', function (req, res) {
    var data = load("process");
    data.sort((a, b) => a.order - b.order);
    if (!data) data = [];
    res.send(data);
});

app.post('/process', function (req, res) {
    var data = load('process');
    var max = Math.max.apply(Math, data.map(function(o) { return o.order; }))
    var process = {
        name: req.body.name,
        order: max+1
    }
    update('process', process);
    data = load('process');
    data.sort((a, b) => a.order - b.order);
    res.send(data);
});

app.put('/process', function (req, res) {
    var ids = req.body.ids;
    ids = ids.split(",");
    for (var i=0; i<ids.length; i++) {
        var p = find('process', parseInt(ids[i]));
        p.order = i+1;
        update('process', p);
    }
    var data = load('process');
    data.sort((a, b) => a.order - b.order);
    res.send(data);
});

app.delete('/process', function (req, res) {
    remove('process', req.query.id);
    var data = load("process");
    data.sort((a, b) => a.order - b.order);
    res.send(data);
});

app.get('/job', function (req, res) {
    var data = load("job");
    if (!data) data = [];
    data.forEach(job => {
        var process = job.process.split(',');
        var ps = [];
        var new_ps = [];
        for (var i=0; i<process.length; i++) {
            var p = find('process', process[i]);
            if (p) {
                ps.push(p);
                new_ps.push(process[i]);
            }
        }
        // console.log(new_ps.length, ps.length);
        if (process.length != new_ps.length) {
            job.process = new_ps.join();
            update('job', job);
        }
        job.process = ps;
    });
    res.send(data);
});

app.post('/job', function (req, res) {
    var obj = req.body;
    if (obj.customs) obj.customs = true;
    else obj.customs = false;
    update('job', obj);
    res.send(load('job'));
});

app.put('/job', function (req, res) {
    var obj = req.body;
    update('job', obj);
    res.send('success');
});

app.delete('/job', function (req, res) {
    console.log('remove', req.query.id);
    remove('job', req.query.id);
    res.send('success');
});

app.put('/print', function (req, res) {
    var obj = find('job', req.query.id);
    obj.print = true;
    update('job', obj);
    res.send('success');
});

app.get('/user', function (req, res) {
    var data = load("user");
    if (!data) data = [];
    var current = null;
    for (var i=0; i<data.length; i++) {
        if (req.session.email == data[i].email) {data[i].edit = 1; current = data[i];}
    }
    if (req.query.role == "Guest") 
        res.send([current]);
    else res.send(data);
});

app.post('/user', function (req, res) {
    var user = {
        email: req.query.email,
        password: req.query.password,
        firstname: req.query.firstname,
        lastname: req.query.lastname,
        role: req.query.role,
        created: new Date()
    };
    update('user', user);
    res.send(user);
});

app.delete('/user', function (req, res) {
    console.log('remove', req.query.id);
    remove('user', req.query.id);
    res.send('success');
});

app.get('/mail', function (req, res) {
    var data = load("mail");
    if (!data) data = [];
    res.send(data);
});

app.post('/mail', function (req, res) {
    var mail = {
        mail: req.query.mail
    };
    update('mail', mail);
    res.send(mail);
});

app.delete('/mail', function (req, res) {
    console.log('remove', req.query.id);
    remove('mail', req.query.id);
    res.send('success');
});

app.put('/mail', function (req, res) {
    var data = load("mail");
    var emails = [];
    data.forEach(function(val){
        emails.push(val.mail);
    });

    var html = generate_expired_order_list();

    var mailOptions = {
        from: 'joblistx@networkhero.eu',
        to: emails.join(),
        subject: 'Sending Expired Orders from JoblisteX',
        html: html
    };
      
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
            res.send('error');
        } else {
            console.log('Email sent: ' + info.response);
            res.send('success');
        }
    });
});

app.get('/setting', function (req, res) {
    var obj = find('setting', 1);
    res.send(obj);
});

app.put('/setting', function (req, res) {
    var obj = find('setting', 1);
    var hm = req.body.time;
    hm = hm.split(':');
    obj.mail_at_h = parseInt(hm[0]);
    obj.mail_at_m = parseInt(hm[1]);
    update('setting', obj);

    task.stop();
    task = cron.schedule(obj.mail_at_m+' '+obj.mail_at_h+' * * *', function() {
        console.log('running a task every day');
        var data = load("mail");
        var emails = [];
        data.forEach(function(val){
            emails.push(val.mail);
        });
    
        var html = generate_expired_order_list();
    
        var mailOptions = {
            from: 'joblistx@networkhero.eu',
            to: emails.join(),
            subject: 'Sending Expired Orders from JoblisteX',
            html: html
        };
          
        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
    });
    res.send('success');
});

function generate_expired_order_list() {
    var data = load("job");
    var html = '<h1>Expired Orders List</h1><table><tr><th>Ordner Nr</th><th>Datum</th><th>Methode</th><th>Name</th><th>Produkt</th><th>Menge</th><th>Versand</th></tr>';
    var ccc = 0;
    data.forEach(function(d){
        var exp = new Date(d.date);
        var today = new Date();
        today.setDate(today.getDate() + 1);
        today.setHours(0, 0, 0, 0);
        if (exp < today && !d.archieved) {
            var completed_process_count = 0;
            var process_ids = d.process.split(',');
            for (var ii=0; ii<process_ids.length; ii++) {
                var deal_process = find('process', parseInt(process_ids[ii]));
                if (d.step && d.step.find(s => (s.status === deal_process.name) && !s.start)) completed_process_count ++; 
            }
            if (completed_process_count == process_ids.length) return;
            html += '<tr>';
            html = html + '<td>'+d.order+'</td>' + '<td>'+exp.toLocaleDateString()+'</td>' + '<td>'+d.method+'</td>' + '<td>'+d.name+'</td>' + '<td>'+d.product+'</td>' + '<td>'+d.qty+'</td>' + '<td>'+d.shipping+'</td>';
            html += '</tr>';
            ccc ++;
            console.log('xxx', ccc, completed_process_count, d.order);
        }
    });
    html += '</table>';
    return html;
}
generate_expired_order_list();

// signaling
io.on('connection', socket => {
    socket.on('scan', function (obarcode) {
        console.log('scan', obarcode);
        // barcode = barcode.replace(/ß/g, "-");
        var isStart = obarcode.charAt(0) == '2';
        var barcode = obarcode.substring(1);

        if (!(barcode.length == 16 || barcode.length == 12)) {io.sockets.emit('scanned', {product: "Invalid Barcode Scanned", step: "None", barcode: obarcode, type:"error"}); return;}

        const pid = parseInt(barcode.substring(0, barcode.length/2))+"";
        const sid = parseInt(barcode.substring(barcode.length/2))+"";
        
        var job = find('job', pid);
        var step = find('process', sid);
        
        if (!job) {io.sockets.emit('scanned', {product: "No Product", step: "None", barcode: obarcode, type:"error"});return;}
        if (!step) {io.sockets.emit('scanned', {product: job.order, step: "No Process", barcode: obarcode, type:"error"});return;}

        if (job) {
            if (!job.step) job.step = [];

            var process = job.process.split(',');
            if (process.indexOf(sid) < 0) {
                console.log(process, sid);
                io.sockets.emit('scanned', {product: job.order, step: "Missed Process", barcode: obarcode, type:"error"});
            } else {
                for (var i=0; i<process.length; i++) {
                    if (process[i] == sid) break;
                    var cstep = find('process', process[i]);
                    var ccstep = job.step.find(s => s.status === cstep.name);
                    if (!ccstep || ccstep.start) {
                        io.sockets.emit('scanned', {product: job.order, step: "Missed Process "+cstep.name, barcode: obarcode, type:"error"});
                        return;
                    }
                }
                var jstep = job.step.find(s => s.status === step.name);
                if (jstep) {
                    if (jstep.start && !isStart) {
                        jstep.start =false;
                        update("job", job);
                    } else {
                        io.sockets.emit('scanned', {product: job.order, step: "Repeated "+step.name+(isStart?" Beginn":" Ende"), barcode: obarcode, type:"warning"});
                        return; 
                    }
                } else {
                    job.step.push({status: step.name, start: isStart, time: new Date()});
                    update("job", job);
                }
                io.sockets.emit('scanned', {product: job.order, step: step.name+(isStart?" Beginn":" Ende"), barcode: obarcode, type:"success"});
            }    
        } else {
            io.sockets.emit('scanned', {product: "No Product", step: "None", barcode: obarcode, type:"error"});
        }
    });

    socket.on('update-job', function () {
        console.log('update job');
        socket.broadcast.emit('updated-job');
    });

    socket.on('update-process', function () {
        console.log('update process');
        socket.broadcast.emit('updated-process');
    });
    
    socket.on('disconnect', function () {
        
    });  
});

// listener
http.listen(port || 3000, function () {
    console.log('listening on', port);
});

app.all('/db', function(req, res, next) {
    store("user", [
        {
            email: "admin@jobliste.de",
            password: "1",
            firstname: "Ralf",
            lastname: "Schubert",
            created: new Date(),
            role: "Admin"
        },{
            email: "user@jobliste.de",
            password: "1",
            firstname: "-",
            lastname: "-",
            created: new Date(),
            role: "User"
        },{
            email: "guest@jobliste.de",
            password: "1",
            firstname: "-",
            lastname: "-",
            created: new Date(),
            role: "Guest"
        }
    ]);
    store("process", [
        { name: 'PRINT', order: 1}, 
        { name: 'WELD', order: 2}, 
        { name: 'CUT', order: 3}, 
        { name: 'LAMINATE', order: 4}, 
        { name: 'PACK', order: 5}, 
        { name: 'BUILT', order: 6}, 
        { name: 'SHIP', order: 7}
    ]);
    store("job", [
        {
            method: 'Standard + (4)',
            order: '2020102110',
            name: 'Ria',
            product: 'Aluverbundschilder beidseitig 60/42 x 20 cm für Kundenstopper',
            qty: '10 von 100',
            notes: 'Versand ist geklärt! 10 Stk. als Teillieferung versendet',
            shipping: 'Kurier (0-1)',
            customs: true,
            initial: 'C',
            process: '',
            date: new Date()
        },{
            method: 'Express (2)',
            order: '5-5386',
            name: '',
            product: 'Folie blasenfrei / permanent / laminiert 127 x 82 cm',
            qty: '1',
            notes: '',
            shipping: 'Abholung (0)',
            customs: true,
            initial: '',
            process: '',
            date: new Date()
        },
    ]);
    res.send("success");
});