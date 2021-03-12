import NextCors from 'nextjs-cors';

import { connectToDatabase } from "../../util/mongodb";


// Initializing the cors middleware
const cors = {
  methods: ['GET', 'HEAD'],
  origin: '*',
}


const { WEATHER_API_KEY } = process.env

const fetchWeatherForecastApi = async (lat,lon) =>
{
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,current&lang=ru&appid=${WEATHER_API_KEY}&units=metric`,
  );
  return response.json();
}


const getWeatherListIsValid = (weatherList)=>{
  //console.log("getWeatherListIsValid",weatherList.length, weatherList[0].dt)
  if(weatherList.length === 0 || !weatherList[0].dt)
    return false;
  
  const nowDateSec = new Date().getTime() / 1000;
  if(  nowDateSec - weatherList[0].dt > 60 * 30)
   return false

  return true;
}


export default async (req, res) => {
    
  await NextCors(req, res, cors);

  const {lat,lon} = req.query;
  //console.log("lat=, lon=",lat,lon);
 
  let forecastData;
  
 
  const { db } = await connectToDatabase();
  const COLLECTION_FORECAST = "forecast"; 
  const weatherList = await db
    .collection(COLLECTION_FORECAST)
    .find({})
    .filter({'lat':+lat, 'lon':+lon})
     .sort({
      'dt': -1
     })
    .limit(1)
    .toArray();

   if(!getWeatherListIsValid(weatherList)) {
      forecastData = await fetchWeatherForecastApi(lat, lon);
      forecastData.dt = new Date().getTime() / 1000;
     
      db.collection(COLLECTION_FORECAST)
       .insertOne(forecastData) 

   }
   else{
    forecastData = weatherList[0]
   }

  res.json(forecastData);
};

