import { View, Text, Image, TextInput, TouchableOpacity, ScrollView } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { MagnifyingGlassIcon, XMarkIcon } from 'react-native-heroicons/outline'
import { CalendarDaysIcon, MapPinIcon } from 'react-native-heroicons/solid'
import { debounce } from "lodash";
import { theme } from '../theme';
import { fetchLocations, fetchWeatherForecast } from '../api/weather';
import * as Progress from 'react-native-progress';
import { StatusBar } from 'expo-status-bar';
import { weatherImages } from '../constants';
import { getData, storeData } from '../utils/asyncStorage';

export default function HomeScreen() {
  const [showSearch, toggleSearch] = useState(false);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState({})


  const handleSearch = search=>{
    // console.log('value: ',search);
    if(search && search.length>2)
      fetchLocations({cityName: search}).then(data=>{
        // console.log('got locations: ',data);
        setLocations(data);
      })
  }

  const handleLocation = loc=>{
    setLoading(true);
    toggleSearch(false);
    setLocations([]);
    fetchWeatherForecast({
      cityName: loc.name,
      days: '7'
    }).then(data=>{
      setLoading(false);
      setWeather(data);
      storeData('city',loc.name);
    })
  }

  useEffect(()=>{
    fetchMyWeatherData();
  },[]);

  const fetchMyWeatherData = async ()=>{
    let myCity = await getData('city');
    let cityName = 'Islamabad';
    if(myCity){
      cityName = myCity;
    }
    fetchWeatherForecast({
      cityName,
      days: '7'
    }).then(data=>{
      // console.log('got data: ',data.forecast.forecastday);
      setWeather(data);
      setLoading(false);
    })
    
  }

  const handleTextDebounce = useCallback(debounce(handleSearch, 1200), []);

  const {location, current} = weather;

  return (
    <View className="flex-1 relative">
      {/* status Bar */}
      <StatusBar style="dark" />
      {/* Background White Image */}
      <Image source={require('../assets/images/bg.png')}
       className="absolute h-full w-full"
      />
      
        {/* loading view */}
        {
          loading? (
            <View className="flex-1 flex-row justify-center items-center">
              <Progress.CircleSnail thickness={10} size={140} color="black" />
            </View>
          ):(
            <SafeAreaView className="flex flex-1">
              {/* search section */}
              <View style={{height: '7%'}} className="mx-4 relative z-50">
                <View 
                  className="flex-row justify-end items-center rounded-full" 
                  style={{backgroundColor: showSearch? theme.bgWhite(1.0): 'transparent'}}>
                  
                    {
                      showSearch? (
                        <TextInput 
                          onChangeText={handleTextDebounce} 
                          placeholder="Search city" 
                          placeholderTextColor={'gray'} 
                          className="pl-6 h-10 pb-1 flex-1 text-base text-black" 
                        />
                      ):null
                    }
                    {/* Toushable search Icon */}
                    <TouchableOpacity 
                      onPress={()=> toggleSearch(!showSearch)} 
                      className="rounded-full p-3 m-1" 
                      style={{backgroundColor: theme.bgWhite(1.0)}}>
                      {
                        showSearch? (
                          <XMarkIcon size="25" color="black" />
                        ):(
                          <MagnifyingGlassIcon size="25" color="black" />
                        )
                      }
                      
                  </TouchableOpacity>
                </View>

                {/* suggest location */}
                {
                  locations.length>0 && showSearch?(
                    <View className="absolute w-full bg-gray-200 top-16 rounded-3xl ">
                      {
                        locations.map((loc, index)=>{
                          let showBorder = index+1 != locations.length;
                          let borderClass = showBorder? ' border-b-2 border-b-gray-400':'';
                          return (
                            <TouchableOpacity 
                              key={index}
                              onPress={()=> handleLocation(loc)} 
                              className={"flex-row items-center border-0 p-3 px-4 mb-1 "+borderClass}>
                                <MapPinIcon size="20" color="gray" />
                                <Text className="text-black text-lg ml-2">{loc?.name}, {loc?.country}</Text>
                            </TouchableOpacity>
                          )
                        })
                      }
                    </View>
                  ):null
                } 
              </View>

              {/* forecast section */}
              <View className="mx-4 flex justify-around flex-1 mb-2">
                {/* location */}
                <Text className="text-black text-center text-3xl font-bold">
                  {location?.name}, 
                  <Text className="text-lg text-darkgray-300 font-semibold ">{location?.country}</Text>
                </Text>
                {/* weather image */}
                <View className="flex-row justify-center">
                  <Image  
                    source={weatherImages[current?.condition?.text || 'other']} 
                    className="w-52 h-52" />
                  
                </View>

                {/* celcius */}
                <View className="space-y-2">
                    <Text className="text-center font-bold text-black text-7xl ml-5">
                      {current?.temp_c}&#176;C
                    </Text>
                    <Text className="text-center text-black text-2xl tracking-widest">
                      {current?.condition?.text}
                    </Text>
                </View>

                {/* wind speed, humidity and sunrise */}
                <View className="flex-row justify-between mx-4">
                  <View className="flex-row space-x-2 items-center">
                    <Image source={require('../assets/icons/wind.png')} className="w-7 h-7" />
                    <Text className="text-black font-semibold text-base">{current?.wind_kph}km</Text>
                  </View>
                  <View className="flex-row space-x-2 items-center">
                    <Image source={require('../assets/icons/drop.png')} className="w-7 h-7" />
                    <Text className="text-black font-semibold text-base">{current?.humidity}%</Text>
                  </View>
                  <View className="flex-row space-x-2 items-center">
                    <Image source={require('../assets/icons/sun.png')} className="w-7 h-7" />
                    <Text className="text-black font-semibold text-base">
                      { weather?.forecast?.forecastday[0]?.astro?.sunrise }
                    </Text>
                  </View>
                  
                </View>
              </View>
            </SafeAreaView>
          )
        }
      
    </View>
  )
}
