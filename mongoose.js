const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/imusic', 
    {
        useNewUrlParser: true, 
        useUnifiedTopology:true
    }).then(() => {
        console.log('connnection sucs');
    }).catch(() => {
        console.log('error');
    })