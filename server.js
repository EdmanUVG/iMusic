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
    try {
        pool.connect(async (error, client, release) => {
            let resp = await client.query (
                ` SELECT nombre_playlist FROM playlists WHERE id = $1 ORDER BY 1 ASC LIMIT 5`, [req.user.id] );

            let recentAlbum = await client.query (`SELECT * FROM albums WHERE fecha_album = (
                SELECT MAX(fecha_album) FROM albums)`);

            let popularArtist = await client.query(`SELECT a.nombre, COUNT(*) FROM playlists c 
                INNER JOIN artistas a ON a.codigo_artista = c.codigo_artista
                INNER JOIN albums b ON c.codigo_album = b.codigo_album GROUP BY a.nombre order by 2 desc`);

            let newSubscriptions = await client.query(`SELECT COUNT(*) FROM suscripciones
                WHERE fecha_de_suscripcion > current_date - interval '3 month'`);

            let withMoreProduction = await client.query(`SELECT a.nombre, COUNT(*) FROM canciones c 
                INNER JOIN artistas a ON a.codigo_artista=c.codigo_artista GROUP BY a.nombre ORDER BY 2 DESC LIMIT 3`);
            
            let popularGenre = await client.query(`SELECT g.descripcion_genero, COUNT(*) FROM canciones c 
            INNER JOIN genero g ON g.codigo_genero=c.codigo_genero GROUP BY g.descripcion_genero ORDER BY 2 DESC`);

            let amountLog = await client.query(`SELECT correo, cantidad_veces_logeado FROM usuarios 
                ORDER BY 2 desc`);
   
            res.render('dashboard', {user: req.user.nombre, email: req.user.correo,
                    subscription: req.user.codigo_suscripcion, userRole: req.user.codigo_tipo_usuario,
                    amountPlays: req.user.cantidad_canciones_usuarios, 
                    playlists: resp.rows,
                    mostRecentAlbum: recentAlbum.rows[0]["nombre_album"],
                    mostPopularArtist: popularArtist.rows[0]["nombre"],
                    mostPopularArtist2: popularArtist.rows[1]["nombre"],
                    mostPopularArtist3: popularArtist.rows[2]["nombre"],
                    numberNewSubscriptions: newSubscriptions.rows[0]["count"],
                    artistWithMoreProduction: withMoreProduction.rows[0]["nombre"],
                    artistWithMoreProduction2: withMoreProduction.rows[1]["nombre"],
                    artistWithMoreProduction3: withMoreProduction.rows[2]["nombre"],
                    popularGenres: popularGenre.rows[0]["descripcion_genero"],
                    popularGenres2: popularGenre.rows[1]["descripcion_genero"],
                    amountLogs: amountLog.rows[0]["correo"],
                    amountLogs2: amountLog.rows[1]["correo"],
                    amountLogs3: amountLog.rows[2]["correo"]});
        })
    } catch(error) {
        console.log(error);
    }
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

app.get('/users/canciones', (req, res) => {
    res.render("canciones");
});

app.get('/users/addtrack', (req, res) => {
    res.render("addtrack");
});

app.get('/users/deleteArtist', (req, res) => {
    res.render("deleteArtist");
});

app.get('/users/updateartist', (req, res) => {
    res.render("updateartist");
});

app.get('/users/udpatealbum', (req, res) => {
    res.render("udpatealbum");
});

app.get('/users/updatetomonitor', (req, res) => {
    res.render("updatetomonitor");
});

app.get('/users/updatetrack', (req, res) => {
    res.render("updatetrack");
});

app.get('/users/deactivateuserartist', (req, res) => {
    res.render("deactivateuserartist");
});

app.get('/users/deactivateuserwithoutsubscription', (req, res) => {
    res.render("deactivateuserwithoutsubscription");
});

app.get('/users/deactivatetrack', (req, res) => {
    res.render("deactivatetrack");
});

app.get('/users/deactivatealbum', (req, res) => {
    res.render("deactivatealbum");
});

app.get('/users/artista', (req, res) => {

    try {
        pool.connect(async (error, client, release) => {
            let resp = await client.query (`SELECT nombre FROM artistas WHERE codigo_artista = $1 order by nombre desc`, [req.user.id.toString()]);

            res.render('artista', {user: req.user.nombre, email: req.user.correo,
            subscription: req.user.codigo_suscripcion, userRole: req.user.codigo_tipo_usuario, 
            artistName: resp.rows[0]["nombre"]});
        })
    } catch(error) {
        console.log(error);
    }
});

app.get('/users/bitacora', (req, res) => {
    try {
        pool.connect(async (error, client, release) => {
            let resp = await client.query (`SELECT * FROM bitacora ORDER  BY ctid DESC;`);

            res.render('bitacora', {user: req.user.nombre, email: req.user.correo,
            subscription: req.user.codigo_suscripcion, userRole: req.user.codigo_tipo_usuario, 
            fechaUno: resp.rows[0]["fecha_hora_bitacora"],
            tablaUno: resp.rows[0]["tabla"],
            columnaUno: resp.rows[0]["columna"],
            accionUno: resp.rows[0]["accion"],
            usuarioUno: resp.rows[0]["usuario"],
            datoAntesUno: resp.rows[0]["dato_antes"],
            datoDespuesUno: resp.rows[0]["dato_despues"],
            fechaDos: resp.rows[1]["fecha_hora_bitacora"],
            tablaDos: resp.rows[1]["tabla"],
            columnaDos: resp.rows[1]["columna"],
            accionDos: resp.rows[1]["accion"],
            usuarioDos: resp.rows[1]["usuario"],
            datoAntesDos: resp.rows[1]["dato_antes"],
            datoDespuesDos: resp.rows[1]["dato_despues"],
            fechaTres: resp.rows[2]["fecha_hora_bitacora"],
            tablaTres: resp.rows[2]["tabla"],
            columnaTres: resp.rows[2]["columna"],
            accionTres: resp.rows[2]["accion"],
            usuarioTres: resp.rows[2]["usuario"],
            datoAntesTres: resp.rows[2]["dato_antes"],
            datoDespuesTres: resp.rows[2]["dato_despues"],
            fechaCuatro: resp.rows[3]["fecha_hora_bitacora"],
            tablaCuatro: resp.rows[3]["tabla"],
            columnaCuatro: resp.rows[3]["columna"],
            accionCuatro: resp.rows[3]["accion"],
            usuarioCuatro: resp.rows[3]["usuario"],
            datoAntesCuatro: resp.rows[3]["dato_antes"],
            datoDespuesCuatro: resp.rows[3]["dato_despues"],
            fechaCinco: resp.rows[4]["fecha_hora_bitacora"],
            tablaCinco: resp.rows[4]["tabla"],
            columnaCinco: resp.rows[4]["columna"],
            accionCinco: resp.rows[4]["accion"],
            usuarioCinco: resp.rows[4]["usuario"],
            datoAntesCinco: resp.rows[4]["dato_antes"],
            datoDespuesCinco: resp.rows[4]["dato_despues"],
            fechaSeis: resp.rows[5]["fecha_hora_bitacora"],
            tablaSeis: resp.rows[5]["tabla"],
            columnaSeis: resp.rows[5]["columna"],
            accionSeis: resp.rows[5]["accion"],
            usuarioSeis: resp.rows[5]["usuario"],
            datoAntesSeis: resp.rows[5]["dato_antes"],
            datoDespuesSeis: resp.rows[5]["dato_despues"],
            fechaSiete: resp.rows[6]["fecha_hora_bitacora"],
            tablaSiete: resp.rows[6]["tabla"],
            columnaSiete: resp.rows[6]["columna"],
            accionSiete: resp.rows[6]["accion"],
            usuarioSiete: resp.rows[6]["usuario"],
            datoAntesSiete: resp.rows[6]["dato_antes"],
            datoDespuesSiete: resp.rows[6]["dato_despues"]});
        })
    } catch(error) {
        console.log(error);
    }
});

app.get('/users/reproduccionesporsemana', (req, res) => {
    try {
        pool.connect(async (error, client, release) => {
            let resp = await client.query (`SELECT * FROM REPRODUCCIONES_SEMANALES('2019-05-01','2022-05-01');`);

            res.render('reproduccionesporsemana', {user: req.user.nombre, email: req.user.correo,
            subscription: req.user.codigo_suscripcion, userRole: req.user.codigo_tipo_usuario, 
            fechaSemanaUno: resp.rows[0]["fecha_semana"],
            totalUno: resp.rows[0]["total"],
            fechaSemanaDos: resp.rows[1]["fecha_semana"],
            totalDos: resp.rows[1]["total"],
            fechaSemanaTres: resp.rows[2]["fecha_semana"],
            totalTres: resp.rows[2]["total"],
            fechaSemanaCuatro: resp.rows[3]["fecha_semana"],
            totalCuatro: resp.rows[3]["total"],
            totalTres: resp.rows[2]["total"],
            fechaSemanaCinco: resp.rows[4]["fecha_semana"],
            totalCinco: resp.rows[4]["total"]});
        })
    } catch(error) {
        console.log(error);
    }
});

app.get('/users/artistasreproducciones', (req, res) => {
    try {
        pool.connect(async (error, client, release) => {
            let resp = await client.query (`SELECT*FROM artista_top('2019-05-01','2022-05-01',2);`);

            res.render('artistasreproducciones', {user: req.user.nombre, email: req.user.correo,
            subscription: req.user.codigo_suscripcion, userRole: req.user.codigo_tipo_usuario, 
            artistaUno: resp.rows[0]["artista"],
            totalUno: resp.rows[0]["total_reproducciones"],
            artistaDos: resp.rows[1]["artista"],
            totalDos: resp.rows[1]["total_reproducciones"]});
        })
    } catch(error) {
        console.log(error);
    }
});

app.get('/users/reproduccionesporgenero', (req, res) => {
    try {
        pool.connect(async (error, client, release) => {
            let resp = await client.query (`SELECT*FROM TOP_GENERO('2019-05-01','2022-05-01');`);

            res.render('reproduccionesporgenero', {user: req.user.nombre, email: req.user.correo,
            subscription: req.user.codigo_suscripcion, userRole: req.user.codigo_tipo_usuario, 
            generoUno: resp.rows[0]["genero"],
            totalUno: resp.rows[0]["total"],
            generoDos: resp.rows[1]["genero"],
            totalDos: resp.rows[1]["total"]});
        })
    } catch(error) {
        console.log(error);
    }
});

app.get('/users/cancionesreproducciones', (req, res) => {
    try {
        pool.connect(async (error, client, release) => {
            let resp = await client.query (`SELECT*FROM TOP_CANCIONES_ARTISTA('Olivia Rodrigo');`);

            res.render('cancionesreproducciones', {user: req.user.nombre, email: req.user.correo,
            subscription: req.user.codigo_suscripcion, userRole: req.user.codigo_tipo_usuario, 
            cancionUno: resp.rows[0]["cancion_artista"],
            totalUno: resp.rows[0]["total"],
            cancionDos: resp.rows[1]["cancion_artista"],
            totalDos: resp.rows[1]["total"]});
        })
    } catch(error) {
        console.log(error);
    }
});


app.get('/users/reportes', (req, res) => {
    try {
        pool.connect(async (error, client, release) => {
            let resp = await client.query (`SELECT * FROM COMISIONES_ARTISTA('Olivia Rodrigo');`);

            res.render('reportes', {user: req.user.nombre, email: req.user.correo,
            subscription: req.user.codigo_suscripcion, userRole: req.user.codigo_tipo_usuario, 
            cancionUno: resp.rows[0]["cancion_artista"],
            pagoUno: resp.rows[0]["pago"]});
        })
    } catch(error) {
        console.log(error);
    }
});

app.get('/users/agregarnombreartista', (req, res) => {
    res.render('agregarnombreartista', {user: req.user.nombre, email: req.user.correo,
        subscription: req.user.codigo_suscripcion, userRole: req.user.codigo_tipo_usuario});
});

app.get('/users/addtrack', (req, res) => {
    res.render('addtrack', {user: req.user.nombre, email: req.user.correo,
        subscription: req.user.codigo_suscripcion, userRole: req.user.codigo_tipo_usuario});
});

app.get("/users/logout", (req, res) => {
    req.logout();
    res.render("index", { message: "You have logged out successfully" });
});

app.post('/users/dashboard', async (req, res) => {
    pool.query(`UPDATE usuarios SET cantidad_canciones_usuarios = $1 WHERE id = $2`, 
        [2, 7],
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
        VALUES ($1, $2, $3, $4, $5)`,
        [req.user.id, 'adsaffkhl12g', '5ZsFI1h6hIdQRw2ti0hz81', '2yuQqhSklmfWgn8lmJNk5t', playlist],
        (err, result) => {
            if (err){
                throw err;
            }
            req.flash("success_msg", "¡Playlist agregado exitosamente!");
            res.redirect('/users/dashboard');
        }  
    )
});


app.post('/users/addtrack', async(req, res) => {
    let { nombre } = req.body;
    pool.query(
        `INSERT INTO canciones (codigo_cancion, codigo_artista, codigo_album, codigo_genero, nombre_cancion)
        VALUES ($1, $2, $3, $4, $5)`,
        [req.user.id.toString(), '1', '1', '1', nombre],
        (err, result) => {
            if (err){
                throw err;
            }
            req.flash("success_msg", "Canción agregado exitosamente!");
            res.redirect('/users/artista');
        }  
    )
});

app.post('/users/agregarnombreartista', async(req, res) => {
    let { nombre } = req.body;
    pool.query(
        `UPDATE artistas SET nombre = $1 WHERE codigo_artista = $2;`,
        [nombre, req.user.id.toString()],
        (err, result) => {
            if (err){
                throw err;
            }
            req.flash("success_msg", "Nombre actualizado exitosamente!");
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
            res.redirect('/users/dashboard');
        }  
    )
});

app.post('/users/actualizar', async(req, res) => {

    try {
        pool.connect(async (error, client, release) => {
            await client.query (`UPDATE usuarios SET 
            codigo_tipo_usuario = $1 WHERE correo = $2`, [1, req.user.correo]);
        
            await client.query(`INSERT INTO artistas 
            (codigo_artista, nombre) VALUES ($1, $2)`, [req.user.id.toString(), req.user.nombre],
                (err, result) => {
                    if (err){
                        throw err;
                    }
                    res.redirect('/users/artista');
                }   
            );
       
            
        })
    } catch(error) {
        console.log(error);
    }
});

app.post('/users/deleteArtist', async(req, res) => {

    let { nombre } = req.body;

    try {
        pool.connect(async (error, client, release) => {
        
            await client.query(`DELETE FROM artistas WHERE nombre = $1`, [nombre],
                (err) => {
                    if (err){
                        throw err;
                    }
                    req.flash("success_msg", "¡Artista fue eliminado exitosamente!");
                    res.redirect('/users/dashboard');
                }   
            );    
        })
    } catch(error) {
        console.log(error);
    }
});

app.post('/users/updateartist', async(req, res) => {

    let { nombre, nuevo } = req.body;

    try {
        pool.connect(async (error, client, release) => {
            let resp = await client.query(`UPDATE artistas set nombre = $1 WHERE nombre = $2`, [nuevo, nombre],
                (err) => {
                    if (err){
                        throw err;
                    }
                    req.flash("success_msg", "¡Artista fue actualizada exitosamente!");
                    res.redirect('/users/dashboard');
                }   
            );            
        })
    } catch(error) {
        console.log(error);
    }
});

app.post('/users/udpatealbum', async(req, res) => {

    let { nombre, nuevo } = req.body;

    try {
        pool.connect(async (error, client, release) => {
            await client.query(`UPDATE albums SET nombre_album = $1 WHERE nombre_album = $2`, [nuevo, nombre],
                (err) => {
                    if (err){
                        throw err;
                    }
                    req.flash("success_msg", "¡Álbum fue actualizada exitosamente!");
                    res.redirect('/users/dashboard');
                }   
            );
        })
    } catch(error) {
        console.log(error);
    }
});

app.post('/users/updatetomonitor', async(req, res) => {

    let { nombre, nuevo } = req.body;

    try {
        pool.connect(async (error, client, release) => {
            await client.query(`UPDATE usuarios SET codigo_tipo_usuario = $1 WHERE correo = $2`, [nuevo, nombre],
                (err) => {
                    if (err){
                        throw err;
                    }
                    req.flash("success_msg", "Usuario fue actualizada exitosamente!");
                    res.redirect('/users/dashboard');
                }   
            );
        })
    } catch(error) {
        console.log(error);
    }
});

app.post('/users/updatetrack', async(req, res) => {

    let { nombre, nuevo } = req.body;

    try {
        pool.connect(async (error, client, release) => {
            let resp = await client.query(`UPDATE canciones SET nombre_cancion = $1 WHERE nombre_cancion = $2`, [nuevo, nombre]);
  
            if (resp === "" || resp === null) {
                req.flash("error_msg", "¡La canción no esta en la base de datos!");
                res.redirect('/users/dashboard');
            } else {
                req.flash("success_msg", "¡La canción fue actualizada exitosamente!");
                res.redirect('/users/dashboard');
            }
        })
    } catch(error) {
        console.log(error);
    }
});

app.post('/users/deactivatetrack', async(req, res) => {

    let { nombre } = req.body;

    try {
        pool.connect(async (error, client, release) => {
            let resp = await client.query(`UPDATE canciones SET estado_cancion = $1 WHERE nombre_cancion = $2`, ["DESACTIVADO", nombre]);
  
            if (resp === "" || resp === null) {
                req.flash("error_msg", "¡La canción no esta en la base de datos!");
                res.redirect('/users/dashboard');
            } else {
                req.flash("success_msg", "¡La canción fue desactivada exitosamente!");
                res.redirect('/users/dashboard');
            }
        })
    } catch(error) {
        console.log(error);
    }
});


app.post('/users/deactivatealbum', async(req, res) => {

    let { nombre } = req.body;

    try {
        pool.connect(async (error, client, release) => {
            let resp = await client.query(`UPDATE albums SET estado_album = $1 WHERE nombre_album = $2`, ["DESACTIVADO", nombre]);
  
            if (resp === "" || resp === null) {
                req.flash("error_msg", "¡El álbum no esta en la base de datos!");
                res.redirect('/users/dashboard');
            } else {
                req.flash("success_msg", "¡El álbum fue desactivada exitosamente!");
                res.redirect('/users/dashboard');
            }
        })
    } catch(error) {
        console.log(error);
    }
});

app.post('/users/deactivateuserwithoutsubscription', async(req, res) => {

    let { nombre } = req.body;

    try {
        pool.connect(async (error, client, release) => {
            // let resp = await client.query(`UPDATE usuarios SET codigo_tipo_usuario = $1 WHERE correo = $2 AND codigo_suscripcion = $3`, [111, nombre, 0]);
  
            let resp = await client.query(`SELECT * FROM usuarios`);

            if (resp === "" || resp === null) {
                req.flash("error_msg", "¡El usuario no esta en la base de datos!");
                res.redirect('/users/dashboard');
            } else {
                req.flash("success_msg", "¡El usuario fue desactivada exitosamente!");
                res.redirect('/users/dashboard');
            }
        })
    } catch(error) {
        console.log(error);
    }
});

app.post('/users/canciones', async(req, res) => {

    try {
        pool.connect(async (error, client, release) => {
            await client.query (`UPDATE usuarios SET cantidad_canciones_usuarios = $1 WHERE id = $2`,
            [parseInt(req.user.cantidad_canciones_usuarios) + 1, req.user.id]);
       
            res.redirect('/users/dashboard');
        })
    } catch(error) {
        console.log(error);
    }
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
                        `INSERT INTO usuarios (id, correo, codigo_suscripcion, codigo_tipo_usuario, contrasena, nombre,
                            cantidad_veces_logeado, cantidad_canciones_usuarios)
                        VALUES (24, $1, $2, $3, $4, $5, $6, $7)
                        RETURNING id, contrasena`,
                        [email, 0, 0, hashedPassword, name, 1, 0],
                        (err, result) => {
                            if (err){
                                throw err;
                            }
                            req.flash("success_msg", "La cuenta fue creada exitosamente. Ahora ingrese abajo");
                            res.redirect('/users/login');
                        }   
                    );
               }
            }
        );
    }
});

app.post('/users/reportes', (req, res) => {
    res.render('reportes');
});

app.post("/users/login", passport.authenticate("local", {
      successRedirect: "/users/dashboard",
      failureRedirect: "/users/login",
      failureFlash: true,
    } ) 

    
);

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        try {
            pool.connect(async (error, client, release) => {
    
                await client.query (`UPDATE usuarios SET 
                cantidad_veces_logeado = $1 WHERE correo = $2`, [parseInt(req.user.cantidad_veces_logeado) + 1, req.user.correo]);
            })
        } catch(error) {
            console.log(error);
        }  
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