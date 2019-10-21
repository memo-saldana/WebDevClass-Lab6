const express = require('express'),
      app = express(),
      request = require('request'),
      MAPBOX_TOKEN = require('./credentials').MAPBOX_TOKEN || process.env.MAPBOX_TOKEN,
      DARK_SKY_SECRET_KEY = require('./credentials').DARK_SKY_SECRET_KEY || process.env.MAPBOX_TOKEN,
      mapboxURL = 'https://api.mapbox.com',
      darkSkyURL = 'https://api.darksky.net',
      PORT = process.env.PORT || 3000;

app.get('/weather', function(req, res) {
  if (!req.query.search) res.send({ error: 'Debes enviar una ciudad' })

  // City to look for
  const city = req.query.search

  geolocationURL = mapboxURL+`/geocoding/v5/mapbox.places/${city}.json?access_token=${MAPBOX_TOKEN}`;

  request.get({url:geolocationURL, json:true}, (err, response, body) => {
    if(err || response.statusCode >= 400 || body.features.length == 0){
      let message = '', statusCode = 400;
      if(response && response.statusCode >= 400){
          statusCode = response.statusCode;
          switch(response.statusCode){
            case 404:
              message = "La ciudad dada no fue encontrada.";
            break;
            case 401:
              message = "Tus credenciales para el api de MapBox son incorrectas.";
            break;
          } 
      } else if(err) {
        // console.log('err :', err);
        switch(err.code){
          case 'ENOTFOUND':
            message = "No se pudo conectar con la api de MapBox.";
          break;
          default:
            message = "Hubo un error desconocido";
        }
      } else {
        if(body.features && body.features.length == 0){
          message = "La ciudad dada no fue encontrada.";
        }
      }
      return res.status(statusCode).json({error: message});
    }
    let feature = body.features[0];
    let lat = feature.center[1];
    let lng = feature.center[0];
    // console.log('lat :', lat);
    // console.log('lng :', lng);

    let weatherURL = darkSkyURL+`/forecast/${DARK_SKY_SECRET_KEY}/${lat},${lng}?units=si&lang=es`;

    request.get({url: weatherURL, json: true}, (err, response, body) => {
      if(err || response.statusCode >= 400){
        let message = "", statusCode = 400;
        if(response && response.statusCode == 403){
          statusCode = 403
          message = "Tus credenciales para el api de DarkSky son incorrectas.";
        } else if(response && response.statusCode == 400){
          message = "La información dada es incorrecta"
        } else {
          // console.log('err :', err);
          switch(err.code){
            case 'ENOTFOUND':
              message = "No se pudo conectar con la api de DarkSky.";
            break;
            default:
              message = "Hubo un error desconocido";
          }
        }
        return res.status(statusCode).json({error: message});
      }
      let {summary, temperature, precipProbability } = body.currently;
      res.status(200).json({
        temperatura: String(temperature) + '°C',
        precipitacion: String(precipProbability) + '%',
        ciudad: city,
        mensaje: summary + '. Actualmente esta a '+ temperature + '°C. Hay '+ precipProbability + '% de probabilidad de lluvia.'
      })
      
    })
  })
})

app.get('*', function(req, res) {
  return res.json({ error: 'Ruta invalida'})
})

app.listen(PORT, ()=> {
  console.log('Running on port '+ PORT)
});