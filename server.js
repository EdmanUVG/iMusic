const express = require('express');
const app = express();
const { pool } = require('./dbConfig');
const bcrypt = require('bcrypt');
const session = require('express-session');
const flash = require('express-flash');
const passport = require('passport');

const PORT = process.env.PORT || 4000;

const initializePassport = require('./passportConfig');

initializePassport(passport);

app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");


app.use(
    session({
        secret: "secret",
        resave: false,
        saveUninitialized: false
    })
);


app.use(passport.initialize());

app.use(passport.session());

app.use(flash());

app.use('/public', express.static('public'));

app.get("/", (req, res) => {
    res.render("index");
});

app.get('/users/register', checkAuthenticated, (req, res) => {
    res.render("register");
});

app.get('/users/login', checkAuthenticated, (req, res) => {
    res.render('login');
});

app.get('/users/dashboard', checkNotAuthenticated, (req, res) => {
    res.render('dashboard', {user: req.user.nombre, email: req.user.correo,
         subscription: req.user.codigo_suscripcion, userRole: req.user.codigo_tipo_usuario});
});

app.get('/users/playlist', (req, res) => {
    res.render("playlist");
});

app.get('/users/premium', (req, res) => {
    res.render("premium");
});

app.get('/users/actualizar', (req, res) => {
    res.render("actualizar");
});

app.get('/users/artista', (req, res) => {

    async function getName() {
        
        const result = await pool.query(
            `SELECT nombre from artistas WHERE codigo_artista = $1`, 
            ['7']
        );
        if (!result || !result.rows || !result.rows.length) return null;
        // return result.rows[0]["nombre"];
        res.render('artista', {user: req.user.nombre, email: req.user.correo,
            subscription: req.user.codigo_suscripcion, userRole: req.user.codigo_tipo_usuario, 
            artistName: result.rows[0]["nombre"]});
    }

    getName();

});

app.get('/users/agregarnombreartista', (req, res) => {
    res.render('agregarnombreartista', {user: req.user.nombre, email: req.user.correo,
        subscription: req.user.codigo_suscripcion, userRole: req.user.codigo_tipo_usuario});
});

app.get("/users/logout", (req, res) => {
    req.logout();
    res.render("index", { message: "You have logged out successfully" });
});

app.post('/users/dashboard', async(req, res) => {
    let { playlist } = req.body;
    pool.query(
        `INSERT INTO playlists (id, codigo_cancion, codigo_artista, codigo_album, nombre_playlist)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id`,
        [req.user.id, '1', '1', '1', playlist],
        (err, result) => {
            if (err){
                throw err;
            }
            res.redirect('/users/dashboard');
        }  
    )
});

app.post('/users/playlist', async(req, res) => {
    let { playlist } = req.body;
    pool.query(
        `INSERT INTO playlists (id, codigo_cancion, codigo_artista, codigo_album, nombre_playlist)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id`,
        [req.user.id, '1', '1', '1', playlist],
        (err, result) => {
            if (err){
                throw err;
            }
            res.redirect('/users/dashboard');
        }  
    )
});

app.post('/users/agregarnombreartista', async(req, res) => {
    let { nombre } = req.body;
    pool.query(
        `INSERT INTO artistas (codigo_artista, nombre)
        VALUES ($1, $2)`,
        [req.user.id, nombre],
        (err, result) => {
            if (err){
                throw err;
            }
            res.redirect('/users/artista');
        }  
    )
});

app.post('/users/premium', async(req, res) => {

    pool.query(
        `UPDATE usuarios SET codigo_suscripcion = $1 WHERE correo = $2`,
        [1, req.user.correo],
        (err, result) => {
            if (err){
                throw err;
            }
            console.log(`${req.user.correo}`);
            res.redirect('/users/dashboard');
        }  
    )
});

app.post('/users/actualizar', async(req, res) => {
    
    pool.query(
        `UPDATE usuarios SET codigo_tipo_usuario = $1 WHERE correo = $2`,
        [1, req.user.correo],
        (err, result) => {
            if (err){
                throw err;
            }
            res.redirect('/users/dashboard');
        }  
    )
});

app.post('/users/register', async (req, res) => {
    let { name, email, password, password2 } = req.body;

    let errors = [];

    if (!name || !email || !password || !password2) {
        errors.push({ message: "Please enter all fields"});
    }

    if (password.length < 6) {
        errors.push({ message: "Password should be at least 6 characters"});
    }

    if (password != password2) {
        errors.push({ message: "Password do not match"});
    }

    if (errors.length > 0) {
        res.render("register", {errors});
    } else {
        let hashedPassword = await bcrypt.hash(password, 10);

        pool.query(
            `SELECT * FROM usuarios
            WHERE correo = $1`, [email], (err, results) => {
               if (err) {
                   throw err
               }

               if (results.rows.length > 0) {
                   errors.push({ message: "Email already exists"});
                   res.render("register", { errors });
               } else {
                   pool.query(
                        `INSERT INTO usuarios (correo, codigo_suscripcion, codigo_tipo_usuario, contrasena, nombre)
                        VALUES ($1, $2, $3, $4, $5)
                        RETURNING id, contrasena`,
                        [email, 0, 0, hashedPassword, name],
                        (err, result) => {
                            if (err){
                                throw err;
                            }
                            req.flash("success_msg", "You are now registered. Please log in");
                            res.redirect('/users/login');
                        }   
                    );
               }
            }
        );
    }
});

app.post(
    "/users/login",
    passport.authenticate("local", {
      successRedirect: "/users/dashboard",
      failureRedirect: "/users/login",
      failureFlash: true
    })
);

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return res.redirect("/users/dashboard");
    }
    next();
}
  
  function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect("/users/login");
}

app.listen(PORT, () => {
    console.log(`Server runnign port: ${PORT}`);
})