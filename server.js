
const express=require("express");
const bodyParser=require("body-parser");
const app=express();
const https=require('https');
const path = require('path');
const cors=require('cors');
const { default: mongoose } = require("mongoose");
const {reset}=require('nodemon');
const { Http2ServerRequest } = require("http2");
const port=3000;
app.set('view engine','ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended:true
}));
app.use(cors({
  origin: '*'
}));





//Connecting with my mongo DB Atlas Dataada
const mongoDB="mongodb+srv://admin-vamsi:vamsi123@cluster0.fsbdals.mongodb.net/WeatherDB";

mongoose.set('strictQuery',true);
mongoose.connect(mongoDB,{useNewUrlParser:true});

// Have Node serve the files for our built React app
app.use(express.static(path.resolve(__dirname, '../client/build')));
//Creating a Schema for our collection in DB
const weatherSchema={
  city:{type:String,},
  temp:String,
  des:String,
  pressure:String,
  humidity:String,
  long:String,
  lat:String
};
const Weather=mongoose.model("Weather",weatherSchema);

//getWeathers function will retrivet the weather data from Weather Map API and store it in our DataBase
getWeathers=()=>{

units="metric";
const apikey="b6bb336b3c538e59013637f2a93e6faa";
cities=['mumbai','Delhi','Bangalore','Hyderabad','ahmedabad','Chennai','Kolkata'
,'Surat','Pune','Jaipur','Lucknow','Kanpur'
,'Indore','Thane','Bhopal','Visakhapatnam',
'patna','agra','Nashik','Faridabad','Meerut','Rajkot','Varanasi','Srinagar','Aurangabad','Amritsar','Ranchi','gaya','jammu','nellore'];

cities.forEach(async(element) => {
    const url="https://api.openweathermap.org/data/2.5/weather?q="+element+"&appid="+apikey+"&units="+units+"";
    //Requesting data from API 
    https.get(url,function(response){
  
        if(response.statusCode==404){
            console.log(element);
        }
        response.on("data",function(data){
            const weatherData=JSON.parse(data);
            const temp=weatherData.main.temp;
            const weatherDescription=weatherData.weather[0].description;
            const pres=weatherData.main.pressure;
            const hum=weatherData.main.humidity;
            const longi=weatherData.coord.lon;
            const lati=weatherData.coord.lat;
            var weather1=new Weather({
                city:element,
                temp:temp,
                des:weatherDescription,
                pressure:pres,
                humidity:hum,
                long:longi,
                lat:lati
            });
            
            //inserting data into our DataBase if there is any changes in temperature the data will be updated automatically
            Weather.updateOne({city:weather1.city},weather1,{upsert:true});
            
        });
    });

});
}

//The Get weathers function will be called every 10 minutes inorder to update the data
setInterval(getWeathers,1000*60*10);

//The get method which will be called for the given 
app.get("/api",async(req,res)=>{
    const { page = 1, limit = 10 } = req.query;
    getWeathers();
  try {
    // execute query with page and limit values
    const weathers = await Weather.find()
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // get total documents in the Posts collection 
    const count = await Weather.countDocuments();

    // return response with posts, total pages, and current page
    res.json({users:weathers,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (err) {
    console.error(err.message);
  }
})

app.listen(5000,(req,res)=>{
    console.log("Server started at port 5000");
});
