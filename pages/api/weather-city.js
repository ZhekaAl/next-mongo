import { connectToDatabase } from "../../util/mongodb";

const { WEATHER_API_KEY } = process.env

const fetchWeatherCityApi = async (id) =>
{
 const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?id=${id}&lang=ru&appid=${WEATHER_API_KEY}&units=metric`,
  );

  return response.json();

 }


const getWeatherListIsValid = (weatherList)=>{
  if(weatherList.length === 0)
    return false;
  
  const nowDateSec = new Date().getTime() / 1000;
  if(  nowDateSec - weatherList[0].dt > 60 * 30)
   return false

  return true;
}


export default async (req, res) => {

    
  
  const id = +req.query.id;
  console.log("id=",id);

  let cityData;
  
 
  const { db } = await connectToDatabase();
  const weatherList = await db
    .collection("weather")
    .find({})
    .filter({'id':id})
    .sort({
      'dt': -1
    })
    .limit(1)
    .toArray();

   if(!getWeatherListIsValid(weatherList)) {
     cityData = await fetchWeatherCityApi(id);
     db.collection("weather")
       .insertOne(cityData) 

   }
   else{
     cityData = weatherList[0]
   }

  res.json(cityData);
};

