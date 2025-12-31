<!DOCTYPE html>
<html lang="fa" dir="rtl">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>{{ config('app.name', 'دن کلاب') }}</title>

        <!-- Vazir Font -->
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/rastikerdar/vazir-font@v30.1.0/dist/font-face.css">

        @viteReactRefresh
        @vite(['demo-client/css/app.css', 'demo-client/js/app.jsx'])
    </head>
    <body>
        <div id="app"></div>
    </body>
</html>
