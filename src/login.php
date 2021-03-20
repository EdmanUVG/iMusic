<?php

    $dbconn = pg_connect("host=localhost port=5432 user=postgres password=Tec2021 dbname=postgres")
    or die("No se ha podido conectar: " . preg_last_error());

    $username = $_POST['username'];
    $password = $_POST['password'];

    $query  = "SELECT * FROM visita_restaurante;";
    $result = pg_query($query);

    // $query = "INSERT INTO usuario VALUES ('$username', '$password')";
    //  $result = pg_query($query) or die('La consulta fallo' . preg_last_error());
    
?>