const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
    cancion: String,
    artista: String,
    album: String,
    fecha: String,
    correo: String
});

const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog;