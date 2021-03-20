<?php

    $dbconn = pg_connect("host=localhost port=5432 user=postgres password=marco123 dbname=imusic")
    or die("No se ha podido conectar: " . preg_last_error());

    $username = $_POST['username'];
    $password = $_POST['password'];

    $query = "INSERT INTO usuario VALUES ('$username', '$password')";
    $result = pg_query($query) or die('La consulta fallo' . preg_last_error());
    
?>