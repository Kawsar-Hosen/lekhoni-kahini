import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, BackHandler, Easing, Image, KeyboardAvoidingView, PanResponder, Platform, Pressable, RefreshControl, ScrollView, Share, StyleSheet, Switch, Text, TextInput, Linking, View, useWindowDimensions, ActivityIndicator, Vibration } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import Svg, { Path, Polyline, Ellipse, Circle, G, Line } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ExpoNotifications from 'expo-notifications';
import * as Device from 'expo-device';

import { initialState, loadState, saveState, clearState } from './src/storage';
import { Book, LocalState, Language } from './src/types';
import { copy, CopyKey } from './src/i18n';
import { fetchRemoteBooks, fetchRemoteBook, fetchRemoteCategories, fetchRemoteNotifications, trackEvent, fetchFollowedWriters, writerSignup, writerLogin, writerGoogleAuth, verifyWriterToken, fetchWriterStats, fetchWriterStories, createWriterStory, updateWriterProfile, followWriter, unfollowWriter, fetchWriterDashboard, fetchWriterNotifications, markWriterNotificationsRead, deleteWriterNotification, submitStoryForReview, updateWriterStory, deleteWriterStory, fetchWriterStoryDetail, createStoryChapter, deleteStoryChapter, fetchPublicWriters, fetchRemoteComments, submitComment, fetchCommentsConfig, toggleBookLike, fetchHomeSections, fetchUserState, saveUserState, HomeSectionsData, fetchWriterFollowers, fetchAbout, deleteWriterAccount, submitReport, userSignup, userLogin, verifyUserToken, registerPushToken, updateUserProfile } from './src/api';
import { pickAndResizeImage } from './src/imageUpload';

type Tab = 'home'|'library'|'categories'|'episodes'|'profile';
type Screen = { type:'main' } | { type:'book', id:string } | { type:'reader', id:string, chapter:number } | { type:'search' } | { type:'notifications' } | { type:'settings' } | { type:'writer' } | { type:'list', title:string, ids:string[] } | { type:'profileDetails' } | { type:'followedWriters' } | { type:'writerProfile', writer:import('./src/types').WriterProfile } | { type:'comments', id:string } | { type:'allWriters' } | { type:'newStory' } | { type:'editStory', id:string, title:string, desc:string, coverUrl:string|null, writerStatus:string } | { type:'aboutApp' } | { type:'terms' };
type Theme = {dark:boolean;primary:string;bg:string;card:string;ink:string;muted:string;line:string;tint:string;reader:string};
const I = (name:string) => (Feather.glyphMap as Record<string,unknown>)[name] ? name as keyof typeof Feather.glyphMap : 'bell';

function SplashScreen({theme}:{theme:Theme}){
  const[typed,setTyped]=useState('');
  const full='লেখনী কাহিনী';
  const{height}=useWindowDimensions();
  const fadeAnim=useRef(new Animated.Value(0)).current;
  const scaleAnim=useRef(new Animated.Value(0.7)).current;
  const glowAnim=useRef(new Animated.Value(0.2)).current;
  const breathe=useRef(new Animated.Value(0)).current;
  useEffect(()=>{
    Animated.parallel([
      Animated.timing(fadeAnim,{toValue:1,duration:1000,useNativeDriver:true}),
      Animated.spring(scaleAnim,{toValue:1,friction:7,useNativeDriver:true}),
    ]).start();
    Animated.loop(Animated.sequence([
      Animated.timing(breathe,{toValue:1,duration:2000,easing:Easing.inOut(Easing.sin),useNativeDriver:true}),
      Animated.timing(breathe,{toValue:0,duration:2000,easing:Easing.inOut(Easing.sin),useNativeDriver:true}),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(glowAnim,{toValue:0.5,duration:1800,useNativeDriver:true}),
      Animated.timing(glowAnim,{toValue:0.2,duration:1800,useNativeDriver:true}),
    ])).start();
    let i=0;const iv=setInterval(()=>{i++;setTyped(full.slice(0,i));if(i>=full.length)clearInterval(iv)},80);return()=>clearInterval(iv);
  },[]);
  const circleSize=Math.min(height*0.38,260);
  return <View style={{flex:1,backgroundColor:'#054D45',alignItems:'center',justifyContent:'center'}}>
    <View style={{position:'absolute',top:0,left:0,right:0,bottom:0,overflow:'hidden'}}>
      <View style={{position:'absolute',width:height*0.6,height:height*0.6,borderRadius:height*0.3,backgroundColor:'rgba(255,255,255,0.025)',top:-height*0.12,right:-height*0.15}}/>
      <View style={{position:'absolute',width:height*0.45,height:height*0.45,borderRadius:height*0.225,backgroundColor:'rgba(255,255,255,0.02)',bottom:-height*0.08,left:-height*0.12}}/>
      <View style={{position:'absolute',width:height*0.3,height:height*0.3,borderRadius:height*0.15,backgroundColor:'rgba(255,255,255,0.018)',top:height*0.55,right:height*0.1}}/>
    </View>
    <Animated.View style={{alignItems:'center',opacity:fadeAnim,transform:[{scale:scaleAnim}]}}>
      <Animated.View style={{width:circleSize,height:circleSize,borderRadius:circleSize/2,backgroundColor:'rgba(255,255,255,0.08)',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'rgba(255,255,255,0.1)',transform:[{scale:breathe.interpolate({inputRange:[0,1],outputRange:[0.97,1.03]})}],shadowColor:'#fff',shadowOpacity:0.06,shadowRadius:30,shadowOffset:{width:0,height:0},elevation:8}}>
        <Svg width={circleSize*0.52} height={circleSize*0.52} viewBox="0 0 100 100" fill="none">
          <G opacity={0.9}>
            <Path d="M50 25 C50 25, 62 35, 62 48 C62 56, 56 62, 50 62 C44 62, 38 56, 38 48 C38 35, 50 25, 50 25Z" fill="rgba(255,255,255,0.85)"/>
            <Path d="M50 25 C50 25, 38 20, 30 30 C22 40, 30 52, 38 50" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" fill="none"/>
            <Path d="M50 25 C50 25, 62 20, 70 30 C78 40, 70 52, 62 50" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" fill="none"/>
            <Path d="M50 62 C50 62, 50 72, 50 82" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
            <Path d="M50 70 C46 66, 40 66, 38 70" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
            <Path d="M50 74 C54 70, 60 70, 62 74" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
            <Circle cx="50" cy="42" r="3" fill="rgba(255,255,255,0.4)"/>
            <Path d="M35 44 C28 48, 22 58, 28 65 C34 72, 42 65, 42 58" stroke="rgba(255,255,255,0.25)" strokeWidth="1" fill="none"/>
            <Path d="M65 44 C72 48, 78 58, 72 65 C66 72, 58 65, 58 58" stroke="rgba(255,255,255,0.25)" strokeWidth="1" fill="none"/>
          </G>
        </Svg>
      </Animated.View>
      <View style={{marginTop:28,alignItems:'center'}}>
        <T style={{color:'#fff',fontSize:34,fontWeight:'900',letterSpacing:1,fontFamily:'HindSiliguriMedium'}}>{typed}<Animated.View style={{width:2,height:28,backgroundColor:'#fff',borderRadius:1,marginLeft:2,opacity:glowAnim,alignSelf:'flex-end',marginBottom:4}}/></T>
      </View>
    </Animated.View>
    <View style={{position:'absolute',bottom:36,alignItems:'center'}}>
      <T style={{color:'rgba(255,255,255,0.2)',fontSize:9,fontWeight:'500',letterSpacing:1}}>LEKHONI KAHINI</T>
    </View>
  </View>;
}

function SkeletonPulse({width,height:ht,borderRadius=8,style}:{width:number|string;height:number|string;borderRadius?:number;style?:any}){
  const anim=useRef(new Animated.Value(0.3)).current;
  useEffect(()=>{Animated.loop(Animated.sequence([Animated.timing(anim,{toValue:0.8,duration:800,useNativeDriver:true}),Animated.timing(anim,{toValue:0.3,duration:800,useNativeDriver:true})])).start()},[]);
  return <Animated.View style={[{width,height:ht,borderRadius,backgroundColor:'#D1D5DB',opacity:anim},style]}/>;
}

function SkeletonScreen({theme}:{theme:Theme}){
  return <View style={{flex:1,backgroundColor:theme.bg,paddingHorizontal:18,paddingTop:60}}>
    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:24}}>
      <View><SkeletonPulse width={180} height={22} borderRadius={6}/><SkeletonPulse width={120} height={14} borderRadius={4} style={{marginTop:8}}/></View>
      <View style={{flexDirection:'row',gap:12}}><SkeletonPulse width={24} height={24} borderRadius={12}/><SkeletonPulse width={24} height={24} borderRadius={12}/></View>
    </View>
    <SkeletonPulse width={160} height={18} borderRadius={4} style={{marginBottom:12}}/>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:12,marginBottom:24}}>
      {[1,2,3].map(i=><View key={i} style={{width:130}}>
        <SkeletonPulse width={130} height={170} borderRadius={14}/>
        <SkeletonPulse width={100} height={14} borderRadius={4} style={{marginTop:8}}/>
        <SkeletonPulse width={80} height={11} borderRadius={3} style={{marginTop:6}}/>
      </View>)}
    </ScrollView>
    <SkeletonPulse width={160} height={18} borderRadius={4} style={{marginBottom:12}}/>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:12,marginBottom:24}}>
      {[1,2,3].map(i=><View key={i} style={{width:130}}>
        <SkeletonPulse width={130} height={170} borderRadius={14}/>
        <SkeletonPulse width={100} height={14} borderRadius={4} style={{marginTop:8}}/>
        <SkeletonPulse width={80} height={11} borderRadius={3} style={{marginTop:6}}/>
      </View>)}
    </ScrollView>
    <SkeletonPulse width={160} height={18} borderRadius={4} style={{marginBottom:12}}/>
    {[1,2].map(i=><View key={i} style={{flexDirection:'row',gap:12,marginBottom:12}}>
      <SkeletonPulse width={80} height={100} borderRadius={12}/>
      <View style={{flex:1}}><SkeletonPulse width={'80%'} height={16} borderRadius={4}/><SkeletonPulse width={'60%'} height={12} borderRadius={3} style={{marginTop:8}}/><SkeletonPulse width={'40%'} height={12} borderRadius={3} style={{marginTop:6}}/></View>
    </View>)}
    <View style={{position:'absolute',bottom:40,left:0,right:0}}>
      <View style={{height:56,backgroundColor:theme.card,borderRadius:28,marginHorizontal:20,borderWidth:1,borderColor:theme.line}}/>
    </View>
  </View>;
}

function ErrorScreen({type,onRetry,theme}:{type:'offline'|'error';theme:Theme;onRetry:()=>void}){
  const isOffline=type==='offline';
  const{height}=useWindowDimensions();
  return <View style={{flex:1,backgroundColor:theme.bg,alignItems:'center',justifyContent:'center',paddingHorizontal:40}}>
    <View style={{width:80,height:80,borderRadius:40,backgroundColor:isOffline?'#FEF3C7':'#FEE2E2',alignItems:'center',justifyContent:'center',marginBottom:24}}>
      <Feather name={isOffline?'wifi-off':'alert-circle'} size={36} color={isOffline?'#D97706':'#DC2626'}/>
    </View>
    <T style={{fontSize:20,fontWeight:'900',color:theme.ink,marginBottom:8,textAlign:'center'}}>{isOffline?'ইন্টারনেট সংযোগ নেই':'কিছু ভুল হয়েছে'}</T>
    <T style={{fontSize:14,fontWeight:'500',color:theme.muted,textAlign:'center',lineHeight:22,marginBottom:32}}>{isOffline?'ইন্টারনেট সংযোগ দিন এবং পুনরায় চেষ্টা করুন':'পুনরায় চেষ্টা করুন'}</T>
    <Pressable onPress={onRetry} style={{backgroundColor:'#087A63',paddingHorizontal:32,paddingVertical:14,borderRadius:14,flexDirection:'row',alignItems:'center',gap:8}}>
      <Feather name="refresh-cw" size={18} color="#fff"/>
      <T style={{color:'#fff',fontSize:16,fontWeight:'800'}}>পুনরায় চেষ্টা করুন</T>
    </Pressable>
  </View>;
}

export default function App(){ return <SafeAreaProvider><AppShell/></SafeAreaProvider>; }
function AppShell(){
 const [fontsLoaded]=useFonts({HindSiliguriMedium:require('./assets/HindSiliguri-Medium.ttf'),IMFellEnglish:require('./assets/IMFellEnglish.ttf')});
 const [state,setState]=useState<LocalState>(initialState); const [loaded,setLoaded]=useState(false); const [dataLoaded,setDataLoaded]=useState(false); const [screen,setScreen]=useState<Screen>({type:'main'}); const [tab,setTab]=useState<Tab>('home'); const [allBooks,setAllBooks]=useState<Book[]>([]); const [allCategories,setAllCategories]=useState<[string,string,string,string|null][]>([]); const [publicWriters,setPublicWriters]=useState<import('./src/types').WriterProfile[]>([]); const [homeData,setHomeData]=useState<HomeSectionsData|null>(null); const [remoteNotices,setRemoteNotices]=useState<{id:string;title:string;body:string;icon:string;url:string;story_cover:string;time:string}[]>([]); const syncRef=useRef(false); const [showExitModal,setShowExitModal]=useState(false);
 const theme=themeFor(state.settings.themeId,state.settings.dark);
  const [dlBooks,setDlBooks]=useState<Record<string,Book>>({});
  useEffect(()=>{AsyncStorage.getItem('@lekhoni/downloads/v1').then(x=>{if(x){try{setDlBooks(JSON.parse(x))}catch{}}}).catch(()=>{})},[]);
  const persistDl=(next:Record<string,Book>)=>{setDlBooks(next);AsyncStorage.setItem('@lekhoni/downloads/v1',JSON.stringify(next)).catch(()=>{})};
  const downloadBook=(id:string)=>{const b=allBooks.find(x=>x.id===id);if(!b)return;persistDl({...dlBooks,[id]:b});setState(s=>s.downloads.includes(id)?s:{...s,downloads:[...s.downloads,id]})};
  const removeDownload=(id:string)=>{const n={...dlBooks};delete n[id];persistDl(n);setState(s=>({...s,downloads:s.downloads.filter(x=>x!==id)}))};
  const resolveBook=(id:string):Book|undefined=>dlBooks[id]||allBooks.find(b=>b.id===id);
  useEffect(()=>{loadState().then(async v=>{const id=v.deviceId;if(id){try{const r=await fetchUserState(id);if(r&&r.synced&&r.state){const st=r.state;const remoteSettings=st.settings&&typeof st.settings==='object'?(st.settings as any):null;v={...v,settings:remoteSettings?{...v.settings,...remoteSettings}:v.settings,history:Array.isArray(st.history)&&st.history.length?[...new Set([...(v.history||[]),...st.history])].slice(0,20):v.history,positions:st.positions&&typeof st.positions==='object'?{...v.positions,...(st.positions as any)}:v.positions,bookmarks:Array.isArray(st.bookmarks)&&st.bookmarks.length?[...new Set([...v.bookmarks,...(st.bookmarks as any[])])].slice(0,50):v.bookmarks}}}catch{}}if(v.userToken){try{const u=await verifyUserToken(v.userToken);if(u)v.user=u;else{v.user=null;v.userToken=null;}}catch{v.user=null;v.userToken=null;}}if(v.writerToken){try{const wv=await verifyWriterToken(v.writerToken);if(wv)v.writer={id:wv.id,username:wv.username,writer_name:wv.writer_name,avatar_url:wv.avatar_url||undefined,bio:wv.bio||undefined};else{v.writer=null;v.writerToken=null;}}catch{v.writer=null;v.writerToken=null;}}if(v.writer&&!v.writer.id){v.writer=null;v.writerToken=null;}setState(v);setLoaded(true)})},[]); useEffect(()=>{if(loaded)saveState(state)},[state,loaded]);
 useEffect(()=>{const sub=BackHandler.addEventListener('hardwareBackPress',()=>{if(screen.type!=='main'){setScreen({type:'main'});return true}if(tab!=='home'){setTab('home');return true}setShowExitModal(true);return true});return()=>sub.remove()},[screen,tab]);
  const syncRemote=useCallback(async()=>{if(syncRef.current)return;syncRef.current=true;try{const[remote,cats,notices,writers,hdata]=await Promise.all([fetchRemoteBooks(),fetchRemoteCategories(),fetchRemoteNotifications(state.deviceId),fetchPublicWriters(),fetchHomeSections()]);if(remote.length){setAllBooks(remote.map(b => b.views_visible !== false && (hdata?.viewsVisible !== false) ? { ...b, views_visible: true } : { ...b, views_visible: false }));if(cats.length)setAllCategories(cats.map(c=>[c.name,c.icon,c.color,c.cover_url||null] as [string,string,string,string|null]));if(notices.length)setRemoteNotices(notices.map(n=>({id:n.id,title:n.title,body:n.body,icon:n.icon||'bell',url:n.url||'',story_cover:n.story_cover||'',time:n.created_at})));if(writers.length)setPublicWriters(writers);if(hdata&&hdata.sections&&hdata.sections.length){setHomeData({...hdata,sections:(hdata.sections||[]).map(x=>({...x,books:(x.books||[]).map((b:any)=>({...b,views_visible:(b.views_visible!==false&&(hdata.viewsVisible!==false))}))}))});if(!writers.length&&hdata.writers&&hdata.writers.length)setPublicWriters(hdata.writers.map(w=>({id:w.id,username:w.username||w.writer_name,writer_name:w.writer_name,bio:w.bio,avatar_url:w.avatar_url,follower_count:w.follower_count,badge:w.badge||'none'})));}setState(s=>({...s,online:true,remoteBooks:remote,lastSync:new Date().toISOString()}));setDataLoaded(true)}else{setState(s=>({...s,online:false}))}}catch{setState(s=>({...s,online:false}));setIsOffline(true)}finally{syncRef.current=false}},[]);
  useEffect(()=>{const id=setInterval(syncRemote,30000);syncRemote();return()=>clearInterval(id)},[syncRemote]);
  useEffect(()=>{if(!loaded||!state.deviceId)return;const t=setTimeout(()=>{saveUserState(state.deviceId,{settings:{...state.settings,name:state.name} as any,favorites:state.favorites,downloads:state.downloads,history:state.history,positions:state.positions,bookmarks:state.bookmarks as any}).catch(()=>{})},2000);return()=>clearTimeout(t)},[loaded,state]);
  useEffect(()=>{_curLang=state.settings.language},[state.settings.language]);
  // Push notification registration
  useEffect(()=>{
    if(!loaded||!state.deviceId)return;
    (async()=>{
      try{
        if(!Device.isDevice){return;}
        const {status:existingStatus}=await ExpoNotifications.getPermissionsAsync();
        if(existingStatus==='granted'){
          const tokenData=await ExpoNotifications.getExpoPushTokenAsync();
          const pushToken=tokenData.data;
          if(pushToken){
            await registerPushToken(state.deviceId,pushToken);
            setState(s=>({...s,pushToken}));
          }
          if(Platform.OS==='android'){
            ExpoNotifications.setNotificationChannelAsync('default',{name:'default',importance:ExpoNotifications.AndroidImportance.MAX,vibrationPattern:[0,250,250,250],lightColor:'#087A63'});
          }
        }else if(!state.pushPromptDismissed){
          setShowNotifPrompt(true);
        }
      }catch(e){console.error('push registration error',e);}
    })();
  },[loaded,state.deviceId]);

  const handleNotifAllow=async()=>{
    setShowNotifPrompt(false);
    try{
      const {status}=await ExpoNotifications.requestPermissionsAsync();
      if(status==='granted'){
        const tokenData=await ExpoNotifications.getExpoPushTokenAsync();
        const pushToken=tokenData.data;
        if(pushToken){
          await registerPushToken(state.deviceId,pushToken);
          setState(s=>({...s,pushToken}));
        }
        if(Platform.OS==='android'){
          ExpoNotifications.setNotificationChannelAsync('default',{name:'default',importance:ExpoNotifications.AndroidImportance.MAX,vibrationPattern:[0,250,250,250],lightColor:'#087A63'});
        }
      }
    }catch(e){console.error('push registration error',e);}
  };
  // Handle notification taps
  useEffect(()=>{
    const sub=ExpoNotifications.addNotificationResponseReceivedListener(response=>{
      const data=response.notification.request.content.data;
      if(data?.storyId){
        setScreen({type:'book',id:data.storyId as string});
      }else if(data?.url){
        Linking.openURL(data.url as string).catch(()=>{});
      }
    });
    return()=>sub.remove();
  },[]);
  const update=(p:Partial<LocalState>)=>setState(s=>({...s,...p})); const open=(id:string)=>{update({history:[id,...state.history.filter(x=>x!==id)].slice(0,20)});setScreen({type:'book',id})}; const read=(id:string,chapter:number)=>setScreen({type:'reader',id,chapter});
  const filteredWriters=React.useMemo(()=>state.writer?publicWriters.filter(w=>w.id!==state.writer!.id):publicWriters,[publicWriters,state.writer]);
  const common=React.useMemo(()=>({theme,state,update,setScreen,open,read,allBooks,allCategories,publicWriters:filteredWriters,homeData,remoteNotices,dlBooks,downloadBook,removeDownload,dataLoaded,syncRemote}),[theme,state,allBooks,allCategories,filteredWriters,homeData,remoteNotices,dlBooks,dataLoaded,syncRemote]);
  const [splashPhase,setSplashPhase]=useState<'splash'|'loading'|'done'>('splash');
  const [showNotifPrompt,setShowNotifPrompt]=useState(false);
  const [loadError,setLoadError]=useState<string|null>(null);
  const [isOffline,setIsOffline]=useState(false);
  const [retryCount,setRetryCount]=useState(0);
  useEffect(()=>{const t=setTimeout(()=>setSplashPhase('loading'),800);return()=>clearTimeout(t)},[]);
  useEffect(()=>{if(splashPhase!=='loading')return;const t=setTimeout(()=>{if(!loaded&&!isOffline)setLoadError('timeout')},15000);return()=>clearTimeout(t)},[splashPhase,loaded,isOffline]);
  if(splashPhase==='splash')return <SplashScreen theme={theme}/>;
  if(splashPhase==='loading'){
    if(isOffline)return <ErrorScreen type="offline" theme={theme} onRetry={()=>{setIsOffline(false);setLoadError(null);setRetryCount(c=>c+1);syncRemote()}}/>;
    if(loadError==='timeout')return <ErrorScreen type="error" theme={theme} onRetry={()=>{setLoadError(null);setRetryCount(c=>c+1);syncRemote()}}/>;
    if(!loaded)return <SkeletonScreen theme={theme}/>;
  }
  if(splashPhase==='loading'&&loaded)setSplashPhase('done');
  if(!state.ageVerified)return <AgeGate theme={theme} lang={state.settings.language} onDone={()=>update({ageVerified:true})}/>;
  if(!state.name)return <NameGate theme={theme} lang={state.settings.language} onDone={(name,lang)=>{update({name,settings:{...state.settings,language:lang}})}}/>;
   let body:React.ReactNode;
 if(screen.type==='main')body=<Main {...common} tab={tab} setTab={setTab}/>;
 if(screen.type==='book')body=<Details {...common} book={resolveBook(screen.id)!}/>;
  if(screen.type==='reader'){const rb=resolveBook(screen.id);if(!rb){setScreen({type:'main'});}else{body=<Reader {...common} book={rb} chapter={screen.chapter}/>}}
 if(screen.type==='search')body=<Search {...common}/>; if(screen.type==='notifications')body=<Notifications {...common}/>; if(screen.type==='settings')body=<Settings {...common}/>; if(screen.type==='writer')body=<Writer {...common}/>;
   if(screen.type==='list')body=<BookList {...common} title={screen.title} ids={screen.ids}/>;
   if(screen.type==='comments')body=<Comments {...common} bookId={screen.id}/>;
  if(screen.type==='profileDetails')body=<ProfileDetails {...common}/>;
  if(screen.type==='followedWriters')body=<FollowedWritersList {...common}/>;
  if(screen.type==='writerProfile')body=<WriterProfileView {...common} writer={screen.writer}/>;
  if(screen.type==='allWriters')body=<AllWritersList {...common}/>;
  if(screen.type==='newStory')body=<NewStoryScreen token={state.writerToken||''} theme={theme} lang={state.settings.language} categories={allCategories.map(c=>c[0])} onBack={()=>setScreen({type:'writer'})} onCreated={()=>{setScreen({type:'writer'})}}/>;
  if(screen.type==='editStory')body=<EditStoryScreen token={state.writerToken||''} theme={theme} lang={state.settings.language} storyId={screen.id} initialTitle={screen.title} initialDesc={screen.desc} initialCover={screen.coverUrl} initialWriterStatus={screen.writerStatus} onBack={()=>setScreen({type:'writer'})} onSaved={syncRemote}/>;
  if(screen.type==='aboutApp')body=<AboutAppScreen theme={theme} lang={state.settings.language} onBack={()=>setScreen({type:'main'})}/>;
  if(screen.type==='terms')body=<TermsScreen theme={theme} lang={state.settings.language} onBack={()=>setScreen({type:'main'})}/>;
  return <View style={{flex:1,backgroundColor:theme.bg}}><StatusBar style={state.settings.dark?'light':'dark'}/>{body}{showExitModal&&<View style={{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'center',alignItems:'center',zIndex:999}}><View style={{backgroundColor:theme.card,borderRadius:24,padding:28,marginHorizontal:40,alignItems:'center',borderWidth:1,borderColor:theme.line,shadowColor:'#000',shadowOpacity:0.2,shadowRadius:20,shadowOffset:{width:0,height:10},elevation:10}}>
        <View style={{width:72,height:72,borderRadius:20,backgroundColor:theme.primary+'18',alignItems:'center',justifyContent:'center',marginBottom:18}}>
          <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
            <Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke={theme.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
            <Polyline points="16 17 21 12 16 7" stroke={theme.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
            <Line x1="21" y1="12" x2="9" y2="12" stroke={theme.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
          </Svg>
        </View>
        <T style={{fontSize:18,fontWeight:'900',color:theme.ink,marginBottom:8,textAlign:'center'}}>{'অ্যাপ থেকে প্রস্থান'}</T>
        <T style={{fontSize:13,color:theme.muted,textAlign:'center',lineHeight:20,marginBottom:24}}>{'আপনি কি নিশ্চিতভাবেই Lekhoni Kahini অ্যাপ থেকে বের হতে চান? আপনার পছন্দের গল্পগুলো অপেক্ষা করছে।'}</T>
        <View style={{flexDirection:'row',gap:10,width:'100%'}}>
          <Pressable onPress={()=>setShowExitModal(false)} style={{flex:1,backgroundColor:theme.primary,paddingVertical:14,borderRadius:14,alignItems:'center'}}>
            <T style={{fontSize:14,fontWeight:'800',color:'#fff'}}>{'থাকুন'}</T>
          </Pressable>
          <Pressable onPress={()=>BackHandler.exitApp()} style={{flex:1,backgroundColor:theme.tint,borderWidth:1.5,borderColor:theme.line,paddingVertical:14,borderRadius:14,alignItems:'center'}}>
            <T style={{fontSize:14,fontWeight:'800',color:'#EF4444'}}>{'বের হোন'}</T>
          </Pressable>
        </View>
      </View></View>}{showNotifPrompt&&<View style={{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'center',alignItems:'center',zIndex:999}}><View style={{backgroundColor:theme.card,borderRadius:24,padding:28,marginHorizontal:32,alignItems:'center',borderWidth:1,borderColor:theme.line,shadowColor:'#000',shadowOpacity:0.2,shadowRadius:20,shadowOffset:{width:0,height:10},elevation:10}}>
        <View style={{width:80,height:80,borderRadius:20,backgroundColor:theme.primary+'18',alignItems:'center',justifyContent:'center',marginBottom:18}}>
          <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
            <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={theme.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
            <Path d="M13.73 21a2 2 0 01-3.46 0" stroke={theme.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
          </Svg>
        </View>
        <T style={{fontSize:18,fontWeight:'900',color:theme.ink,marginBottom:8,textAlign:'center'}}>{'নোটিফিকেশন চালু করুন'}</T>
        <T style={{fontSize:13,color:theme.muted,textAlign:'center',lineHeight:20,marginBottom:24}}>{'নতুন গল্প, অধ্যায় ও ফলোয়ারদের আপডেট পেতে নোটিফিকেশন চালু করুন। আপনি যেকোনো সময় বন্ধ করতে পারবেন।'}</T>
        <View style={{flexDirection:'row',gap:10,width:'100%'}}>
          <Pressable onPress={()=>{update({pushPromptDismissed:true});setShowNotifPrompt(false)}} style={{flex:1,backgroundColor:theme.tint,borderWidth:1.5,borderColor:theme.line,paddingVertical:14,borderRadius:14,alignItems:'center'}}>
            <T style={{fontSize:14,fontWeight:'800',color:theme.muted}}>{'পরে'}</T>
          </Pressable>
          <Pressable onPress={handleNotifAllow} style={{flex:1,backgroundColor:theme.primary,paddingVertical:14,borderRadius:14,alignItems:'center'}}>
            <T style={{fontSize:14,fontWeight:'800',color:'#fff'}}>{'অনুমতি দিন'}</T>
          </Pressable>
        </View>
      </View></View>}</View>;
}
type C={theme:Theme;state:LocalState;update:(p:Partial<LocalState>)=>void;setScreen:(s:Screen)=>void;open:(id:string)=>void;read:(id:string,c:number)=>void;allBooks:Book[];allCategories:[string,string,string,string|null][];publicWriters:import('./src/types').WriterProfile[];homeData:HomeSectionsData|null;remoteNotices:{id:string;title:string;body:string;icon:string;url:string;story_cover:string;time:string}[];dlBooks:Record<string,Book>;downloadBook:(id:string)=>void;removeDownload:(id:string)=>void;dataLoaded:boolean;syncRemote?:()=>void};
const F_BN='HindSiliguriMedium';
const F_EN='IMFellEnglish';
let _curLang:import('./src/types').Language='bn';
const GF=()=>_curLang==='en'?F_EN:F_BN;
function T({style,...rest}:React.ComponentProps<typeof Text>){return <Text {...rest} style={[style,{fontFamily:GF(),fontWeight:'500'}]}/>}
const tr=(p:C,key:CopyKey)=>copy(p.state.settings.language,key);
function greet(p:C){const h=new Date().getHours();const key=h<12?'morning':h<17?'afternoon':h<21?'evening':'night';return tr(p,key as CopyKey);}
function Page({children,theme,onRefresh,refreshing}:{children:React.ReactNode;theme:Theme;onRefresh?:()=>void;refreshing?:boolean}){const insets=useSafeAreaInsets();return <ScrollView style={{flex:1,backgroundColor:theme.bg}} contentContainerStyle={{paddingTop:insets.top+12,paddingHorizontal:18,paddingBottom:110}} showsVerticalScrollIndicator={false} refreshControl={onRefresh?<RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} colors={[theme.primary]} tintColor={theme.primary}/>:undefined}>{children}</ScrollView>}
function AgeGate({theme:t,lang,onDone}:{theme:Theme;lang:import('./src/types').Language;onDone:()=>void}){
  const[checked,setChecked]=useState(false);
  const[curLang,setCurLang]=useState<import('./src/types').Language>(lang);
  const{height}=useWindowDimensions();
  return <KeyboardAvoidingView style={{flex:1,backgroundColor:t.bg}} behavior={Platform.OS==='ios'?'padding':'height'}>
    <ScrollView contentContainerStyle={{paddingHorizontal:25,paddingTop:height*0.15,paddingBottom:40}} keyboardShouldPersistTaps="handled">
      <View style={{alignItems:'center',marginBottom:24}}>
        <Image source={require('./assets/adaptive-icon.png')} style={[styles.gateIcon]} resizeMode="contain"/>
      </View>
      <T style={[styles.eyebrow,{color:t.primary,textAlign:'center'}]}>{copy(curLang,'ageGateTitle')}</T>
      <T style={[styles.gateTitle,{color:t.ink,textAlign:'center',fontSize:22,marginBottom:12}]}>Lekhoni Kahini</T>
      <Pressable onPress={()=>setChecked(!checked)} style={{flexDirection:'row',alignItems:'flex-start',gap:12,backgroundColor:t.card,borderRadius:14,padding:16,marginBottom:20,borderWidth:1.5,borderColor:checked?t.primary:t.line}}>
        <View style={{width:24,height:24,borderRadius:8,borderWidth:2,borderColor:checked?t.primary:t.muted,backgroundColor:checked?t.primary:'transparent',alignItems:'center',justifyContent:'center',marginTop:2}}>
          {checked&&<Feather name="check" size={14} color="#fff"/>}
        </View>
        <View style={{flex:1}}>
          <T style={{fontSize:15,fontWeight:'700',color:t.ink,lineHeight:22}}>{copy(curLang,'ageGateText')}</T>
          <T style={{fontSize:12,color:t.muted,marginTop:4,lineHeight:18}}>{copy(curLang,'ageGateError')}</T>
        </View>
      </Pressable>
      <Pressable onPress={()=>{if(checked)onDone()}} disabled={!checked} style={{backgroundColor:checked?t.primary:t.line,borderRadius:14,height:50,alignItems:'center',justifyContent:'center',opacity:checked?1:0.5}}>
        <T style={{color:'#fff',fontWeight:'700',fontSize:15}}>{copy(curLang,'continueBtn')}</T>
      </Pressable>
      <View style={styles.langRow2}>
        {([['bn','বাংলা'],['en','English'],['hi','हिन्दी']] as [import('./src/types').Language,string][]).map(([code,label])=>
          <Pressable key={code} onPress={()=>setCurLang(code)} style={[styles.langBtn2,{backgroundColor:curLang===code?t.primary:t.card,borderColor:curLang===code?t.primary:t.line}]}>
            <T style={{color:curLang===code?'#fff':t.ink,fontWeight:'800',fontSize:13}}>{label}</T>
          </Pressable>
        )}
      </View>
    </ScrollView>
  </KeyboardAvoidingView>;
}
function NameGate({theme,lang,onDone}:{theme:Theme;lang:import('./src/types').Language;onDone:(n:string,l:import('./src/types').Language)=>void}){const[name,setName]=useState('');const[curLang,setCurLang]=useState<import('./src/types').Language>(lang);const langs:[import('./src/types').Language,string][]=[['bn','বাংলা'],['en','English'],['hi','हिन्दी']];const{height}=useWindowDimensions();return <KeyboardAvoidingView style={{flex:1,backgroundColor:theme.bg}} behavior={Platform.OS==='ios'?'padding':'height'}><ScrollView contentContainerStyle={{paddingHorizontal:25,paddingTop:80,paddingBottom:40}} keyboardShouldPersistTaps="handled"><View style={{alignItems:'center',marginBottom:10}}><Image source={require('./assets/adaptive-icon.png')} style={[styles.gateIcon]} resizeMode="contain"/></View><T style={[styles.eyebrow,{color:theme.primary,textAlign:'center'}]}>{copy(curLang,'welcome')}</T><T style={[styles.gateTitle,{color:theme.ink,textAlign:'center'}]}>{copy(curLang,'nameQuestion')}</T><T style={[styles.copy,{color:theme.muted,textAlign:'center'}]}>{copy(curLang,'gateHint')}</T><TextInput autoFocus value={name} onChangeText={setName} placeholder={copy(curLang,'namePlaceholder')} placeholderTextColor={theme.muted} style={[styles.input,{color:theme.ink,backgroundColor:theme.card,borderColor:theme.line}]}/><Button title={copy(curLang,'startBtn')} icon="arrow-right" disabled={!name.trim()} onPress={()=>onDone(name.trim(),curLang)}/><T style={[styles.note,{color:theme.muted}]}>{copy(curLang,'nameNote')}</T><View style={styles.langRow2}>{langs.map(([code,label])=><Pressable key={code} onPress={()=>setCurLang(code)} style={[styles.langBtn2,{backgroundColor:curLang===code?theme.primary:theme.card,borderColor:curLang===code?theme.primary:theme.line}]}><T style={{color:curLang===code?'#fff':theme.ink,fontWeight:'800',fontSize:13}}>{label}</T></Pressable>)}</View></ScrollView></KeyboardAvoidingView>}
function Main(p:C&{tab:Tab;setTab:(t:Tab)=>void}){
 const {width:screenW}=useWindowDimensions();
 const {theme,tab,setTab}=p;
 const prevTab=React.useRef(tab);
 const content=React.useMemo(()=>tab==='home'?<Home {...p}/>:tab==='library'?<Library {...p}/>:tab==='categories'?<Categories {...p}/>:tab==='episodes'?<Episodes {...p}/>:<Profile {...p}/>,[tab,p.theme,p.state,p.allBooks,p.allCategories,p.publicWriters,p.homeData,p.remoteNotices,p.dlBooks]);
 const tabs:[Tab,string,CopyKey][]=[['home','home','home'],['library','book-open','library'],['categories','grid','categories'],['episodes','layers','episodes'],['profile','menu','menu']];
 const tabIdx=tabs.findIndex(x=>x[0]===tab);
 const slideAnim=React.useRef(new Animated.Value(tabIdx)).current;
 React.useEffect(()=>{Animated.timing(slideAnim,{toValue:tabIdx,duration:170,easing:Easing.bezier(0.25,0.1,0.25,1),useNativeDriver:false}).start();prevTab.current=tab},[tabIdx]);
 const navW=screenW-40;
 const itemW=(navW-12)/tabs.length;
 return <View style={{flex:1}}>{content}<View style={{position:'absolute',bottom:24,left:20,right:20,backgroundColor:theme.card,borderRadius:24,flexDirection:'row',paddingVertical:10,paddingHorizontal:6,shadowColor:'#000',shadowOpacity:0.08,shadowRadius:20,shadowOffset:{width:0,height:8},elevation:8,borderWidth:1,borderColor:theme.line,overflow:'hidden'}}><Animated.View style={{position:'absolute',top:10,bottom:10,left:6,width:itemW,backgroundColor:theme.tint,borderRadius:16,transform:[{translateX:slideAnim.interpolate({inputRange:[0,1,2,3,4],outputRange:[0,itemW,itemW*2,itemW*3,itemW*4]})}]}}/>{tabs.map((x,i)=><Pressable key={x[0]} onPress={()=>setTab(x[0])} style={{flex:1,alignItems:'center',gap:4,paddingVertical:6,zIndex:1}}><Feather name={I(x[1])} size={20} color={tab===x[0]?theme.primary:theme.muted}/><T allowFontScaling={false} numberOfLines={1} style={{fontSize:9,fontWeight:'800',color:tab===x[0]?theme.primary:theme.muted}}>{tr(p,x[2])}</T></Pressable>)}</View></View>
}
function Header({title,sub,theme,action,onNotif,unreadCount}:{title:string;sub?:string;theme:Theme;action?:React.ReactNode;onNotif?:()=>void;unreadCount?:number}){return <View style={styles.header}><View style={{flex:1,marginRight:12}}><T numberOfLines={1} style={[styles.title,{color:theme.ink}]}>{title}</T>{sub&&<T numberOfLines={1} style={{color:theme.muted,marginTop:4}}>{sub}</T>}</View><View style={{flexDirection:'row',alignItems:'center',gap:18}}>{action}<Pressable onPress={()=>onNotif?onNotif():null} style={{position:'relative'}}><Feather name="bell" size={20} color={theme.ink}/>{!!unreadCount&&<View style={[styles.badge,{backgroundColor:'#EF4444'}]}><T style={styles.badgeText}>{unreadCount}</T></View>}</Pressable></View></View>}
function HomeInner(p:C){const un=p.remoteNotices.filter(n=>!p.state.readNotifications.includes(n.id)).length;const books=p.allBooks;const hd=p.homeData;const[refreshing,setRefreshing]=useState(false);const doRefresh=async()=>{if(!p.syncRemote)return;setRefreshing(true);try{await p.syncRemote()}catch{}finally{setRefreshing(false)}};const toBook=(b:any):Book=>({id:b.id,title:b.title,author:b.author,views:`${b.views}`,rating:4.5,color:b.color,accent:b.accent,category:b.category||'',categoryIcon:'book-open',description:b.description||'',updated:'',chapters:[],isNew:Boolean(b.is_new),featured:Boolean(b.featured),views_visible:b.views_visible!==false,cover_url:b.cover_url||null,display_status:b.display_status||undefined,writer_status:b.writer_status||undefined,hide_title_on_cover:b.hide_title_on_cover||false});const hlist=(k:string):Book[]=>{if(hd){const s=hd.sections.find((x:any)=>x.key===k);if(s&&s.books&&s.books.length)return s.books.slice(0,12).map((b:any)=>toBook(b) as Book).filter((b:any)=>b&&b.id);}return[];};const hdtitle=(k:string)=>hd?(hd.sections.find((x:any)=>x.key===k)?.title||''):'';const byViews=(a:Book,b:Book)=>+b.views-(+a.views);const G='#2AA876',AU='#D9A407',BL='#3B82F6',PU='#8B5CF6';const section=(title:string,icon:string,accent:string,list:Book[],sectionKey?:string)=>!list.length?null:<View><View style={styles.secHead}><View style={{flexDirection:'row',alignItems:'center',gap:8}}><View style={[styles.secIcon,{backgroundColor:shade(accent,-30)}]}><Feather name={I(icon)} size={15} color="#fff"/></View><T style={[styles.sectionTitle,{color:p.theme.ink}]}>{title}</T></View><Pressable onPress={()=>p.setScreen({type:'list',title,ids:list.map(x=>x.id)})} style={[styles.seeAllPill,{backgroundColor:shade(accent,-30)}]}><T style={{color:'#fff',fontWeight:'900',fontSize:13,letterSpacing:0.3}}>{tr(p,'seeAllText')}</T></Pressable></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:12,paddingRight:4}}>{list.map((b,i)=><BookCard key={b.id} book={b} theme={p.theme} lang={p.state.settings.language} accent={accent} section={sectionKey} onPress={()=>p.open(b.id)}/>)}</ScrollView></View>;const followedIds=new Set(p.state.followedWriters.map(f=>f.id));const unfollowedWriters=p.publicWriters.filter(w=>!followedIds.has(w.id));const authors=()=>unfollowedWriters.length?<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:12,paddingRight:4}}>{unfollowedWriters.map(w=><AuthorCard key={w.id} writer={w} theme={p.theme} lang={p.state.settings.language} onPress={()=>p.setScreen({type:'writerProfile',writer:w})} bookCount={p.allBooks.filter(b=>b.author===w.writer_name).length}/>)}</ScrollView>:<Empty theme={p.theme}/>;const sections=hd?hd.sections:[];const isFixed=(k:string)=>['featured','mostPopular','newEpisodes','popularAuthors','weeklyPopular','monthlyPopular'].includes(k);const fixedSecs=sections.filter((s:any)=>isFixed(s.key));const catSecs=sections.filter((s:any)=>!isFixed(s.key));const renderFixed=(k:string)=>{if(k==='featured'){const fl=hlist('featured');return <Featured {...p} list={fl}/>;}if(k==='popularAuthors')return <View><View style={styles.secHead}><View style={{flexDirection:'row',alignItems:'center',gap:8}}><View style={[styles.secIcon,{backgroundColor:shade('#EC4899',-30)}]}><Feather name="users" size={15} color="#fff"/></View><T style={[styles.sectionTitle,{color:p.theme.ink}]}>{hdtitle('popularAuthors')||tr(p,'popularAuthors')}</T></View><Pressable onPress={()=>p.setScreen({type:'allWriters'})} style={[styles.seeAllPill,{backgroundColor:shade('#EC4899',-30)}]}><T style={{color:'#fff',fontWeight:'900',fontSize:13,letterSpacing:0.3}}>{tr(p,'seeAllText')}</T></Pressable></View>{authors()}</View>;if(k==='newEpisodes'){const l=hlist('newEpisodes');return section(hdtitle('newEpisodes')||tr(p,'newEpisodes'),'zap',G,l.length?l:books,'newEpisodes');}if(k==='weeklyPopular'){const l=hlist('weeklyPopular');return section(hdtitle('weeklyPopular')||tr(p,'weeklyPopular'),'calendar',BL,l.length?l:(books.length?[...books].sort(byViews):[]),'weeklyPopular');}if(k==='monthlyPopular'){const l=hlist('monthlyPopular');return section(hdtitle('monthlyPopular')||tr(p,'monthlyPopular'),'star',PU,l.length?l:(books.length?[...books].sort(byViews):[]),'monthlyPopular');}if(k==='mostPopular'){const l=hlist('mostPopular');return section(hdtitle('mostPopular')||tr(p,'mostPopular'),'trending-up',AU,l.length?l:(books.length?[...books].sort(byViews):[]),'mostPopular');}return null;};return <Page theme={p.theme} onRefresh={doRefresh} refreshing={refreshing}><Header title={`${greet(p)}, ${p.state.name}`} sub={tr(p,'choose')} theme={p.theme} onNotif={()=>p.setScreen({type:'notifications'})} unreadCount={un}/><Pressable onPress={()=>p.setScreen({type:'search'})} style={{backgroundColor:p.theme.card,borderRadius:14,borderWidth:1,borderColor:p.theme.line,flexDirection:'row',alignItems:'center',paddingHorizontal:14,paddingVertical:13,marginBottom:20,gap:10}}><Feather name="search" size={18} color={p.theme.muted}/><T style={{color:p.theme.muted,fontSize:14,fontWeight:'500',flex:1}}>বই, লেখক বা বিভাগ খুঁজুন</T></Pressable>{!p.dataLoaded&&!books.length?<><View><View style={styles.secHead}><SkeletonPulse width={120} height={16} borderRadius={4}/></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:12,paddingRight:4}}>{[1,2,3].map(i=><View key={i} style={{width:130}}><SkeletonPulse width={130} height={170} borderRadius={14}/><SkeletonPulse width={100} height={14} borderRadius={4} style={{marginTop:8}}/><SkeletonPulse width={80} height={11} borderRadius={3} style={{marginTop:6}}/></View>)}</ScrollView></View><View><View style={styles.secHead}><SkeletonPulse width={140} height={16} borderRadius={4}/></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:12,paddingRight:4}}>{[1,2,3].map(i=><View key={i} style={{width:130}}><SkeletonPulse width={130} height={170} borderRadius={14}/><SkeletonPulse width={100} height={14} borderRadius={4} style={{marginTop:8}}/><SkeletonPulse width={80} height={11} borderRadius={3} style={{marginTop:6}}/></View>)}</ScrollView></View></>:<>{fixedSecs.map((s:any)=><React.Fragment key={s.key}>{renderFixed(s.key)}</React.Fragment>)}{catSecs.length>0&&catSecs.map((s:any)=>{const list=hlist(s.key);if(!list.length)return null;const c=s.color||'#123E39';return <View key={s.key}><View style={styles.secHead}><View style={{flexDirection:'row',alignItems:'center',gap:8}}><View style={[styles.secIcon,{backgroundColor:shade(c,-30)}]}><Feather name={I(s.icon||'book-open')} size={15} color="#fff"/></View><T style={[styles.sectionTitle,{color:p.theme.ink}]}>{s.title}</T></View><Pressable onPress={()=>p.setScreen({type:'list',title:s.title,ids:list.map((x:any)=>x.id)})} style={[styles.seeAllPill,{backgroundColor:shade(c,-30)}]}><T style={{color:'#fff',fontWeight:'900',fontSize:13,letterSpacing:0.3}}>{tr(p,'seeAllText')}</T></Pressable></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:12,paddingRight:4}}>{list.map((b:Book,i:number)=><BookCard key={b.id} book={b} theme={p.theme} lang={p.state.settings.language} accent={c} section={s.key} onPress={()=>p.open(b.id)}/>)}</ScrollView></View>})}</>}</Page>}
const Home=React.memo(HomeInner);
function LibraryLink({title,icon,n,theme,onPress}:{title:string;icon:string;n:number;theme:Theme;onPress:()=>void}){const scale=React.useRef(new Animated.Value(1)).current;const pressIn=()=>{Animated.spring(scale,{toValue:0.96,useNativeDriver:true}).start()};const pressOut=()=>{Animated.spring(scale,{toValue:1,friction:3,tension:40,useNativeDriver:true}).start()};return <Animated.View style={{transform:[{scale}],width:'48.5%'}}><Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} style={{backgroundColor:theme.card,borderRadius:20,borderWidth:1,borderColor:theme.line,paddingVertical:20,paddingHorizontal:16,shadowColor:'#000',shadowOpacity:0.04,shadowRadius:10,shadowOffset:{width:0,height:2},elevation:2}}><View style={{width:44,height:44,borderRadius:14,backgroundColor:theme.tint,alignItems:'center',justifyContent:'center',marginBottom:14}}><Feather name={I(icon)} size={20} color={theme.primary}/></View><T style={{fontSize:14,fontWeight:'800',color:theme.ink,marginBottom:4}}>{title}</T><T style={{color:theme.muted,fontSize:11,fontWeight:'600'}}>{n}টি</T></Pressable></Animated.View>}
function LibBookCard({book,theme,onPress}:{book:Book;theme:Theme;onPress:()=>void}){const hideAll=book.hide_title_on_cover&&book.cover_url;return <Pressable onPress={onPress} style={{backgroundColor:theme.card,borderRadius:18,borderWidth:1,borderColor:theme.line,flexDirection:'row',alignItems:'center',padding:12,marginBottom:12,shadowColor:'#000',shadowOpacity:0.03,shadowRadius:8,shadowOffset:{width:0,height:2},elevation:2,gap:14}}><View style={{width:72,height:96,borderRadius:12,backgroundColor:book.color,overflow:'hidden',justifyContent:'flex-end',padding:hideAll?0:8}}>{book.cover_url?<Image source={{uri:book.cover_url}} style={{position:'absolute',top:0,left:0,right:0,bottom:0,borderRadius:12}} resizeMode="cover"/>:null}{!hideAll&&book.cover_url&&<View style={{position:'absolute',top:0,left:0,right:0,bottom:0,borderRadius:12,backgroundColor:'rgba(0,0,0,0.15)'}}/>}{!hideAll&&<T numberOfLines={2} style={{color:'#fff',fontWeight:'900',fontSize:10,lineHeight:13}}>{book.title}</T>}</View><View style={{flex:1}}><T numberOfLines={2} style={{fontSize:15,fontWeight:'800',color:theme.ink,lineHeight:20}}>{book.title}</T><T numberOfLines={1} style={{fontSize:12,fontWeight:'600',color:theme.primary,marginTop:5}}>{book.author}</T><View style={{flexDirection:'row',alignItems:'center',gap:6,marginTop:8}}><View style={{flexDirection:'row',alignItems:'center',gap:3}}><Feather name="eye" size={11} color={theme.muted}/><T style={{color:theme.muted,fontSize:11}}>{book.views_visible !== false ? book.views : ''}</T></View><View style={{width:3,height:3,borderRadius:1.5,backgroundColor:theme.muted,opacity:0.4}}/><T style={{color:theme.muted,fontSize:11}}>{book.category}</T></View></View><Feather name="chevron-right" size={18} color={theme.muted} style={{opacity:0.5}}/></Pressable>}
function Library(p:C){const[libTab,setLibTab]=React.useState<'downloads'|'favorites'|'history'|'bookmarks'>('downloads');const un=p.remoteNotices.filter(n=>!p.state.readNotifications.includes(n.id)).length;const theme=p.theme;const[refreshing,setRefreshing]=useState(false);const doRefresh=async()=>{if(!p.syncRemote)return;setRefreshing(true);try{await p.syncRemote()}catch{}finally{setRefreshing(false)}};const tabs:{key:'downloads'|'favorites'|'history'|'bookmarks';icon:string;label:string}[]=[{key:'downloads',icon:'download-cloud',label:tr(p,'downloads')},{key:'favorites',icon:'heart',label:tr(p,'favorites')},{key:'history',icon:'clock',label:tr(p,'history')},{key:'bookmarks',icon:'bookmark',label:tr(p,'bookmarks')}];const tabIdx=tabs.findIndex(x=>x.key===libTab);const slideAnim=React.useRef(new Animated.Value(tabIdx)).current;React.useEffect(()=>{Animated.timing(slideAnim,{toValue:tabIdx,duration:170,easing:Easing.bezier(0.25,0.1,0.25,1),useNativeDriver:true}).start()},[tabIdx]);const{width:sw}=useWindowDimensions();const pad=18;const contW=sw-pad*2;const inner=contW-8;const tabW=inner/4;const ids=libTab==='downloads'?p.state.downloads:libTab==='favorites'?p.state.favorites:libTab==='history'?p.state.history:p.state.bookmarks;return <Page theme={theme} onRefresh={doRefresh} refreshing={refreshing}><Header title={tr(p,'library')} sub={tr(p,'librarySub')} theme={theme} onNotif={()=>p.setScreen({type:'notifications'})} unreadCount={un}/><View style={{backgroundColor:theme.card,borderRadius:16,borderWidth:1,borderColor:theme.line,marginBottom:24,shadowColor:'#000',shadowOpacity:0.03,shadowRadius:6,shadowOffset:{width:0,height:2},elevation:2,overflow:'hidden',flexDirection:'row',padding:4}}><Animated.View style={{position:'absolute',top:4,bottom:4,left:4,width:tabW,backgroundColor:theme.tint,borderRadius:12,transform:[{translateX:slideAnim.interpolate({inputRange:[0,1,2,3],outputRange:[0,tabW+4,tabW*2+8,tabW*3+12]})}]}}/>{tabs.map((t,i)=><Pressable key={t.key} onPress={()=>setLibTab(t.key)} style={{flex:1,alignItems:'center',justifyContent:'center',paddingVertical:14,zIndex:1}}><Feather name={I(t.icon)} size={18} color={libTab===t.key?theme.primary:theme.muted}/>{libTab===t.key&&<T style={{fontSize:10,fontWeight:'800',color:theme.primary,marginTop:3}} numberOfLines={1}>{t.label}</T>}</Pressable>)}</View><View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:14}}><T style={{fontSize:17,fontWeight:'900',color:theme.ink}}>{tabs[tabIdx].label}</T><View style={{backgroundColor:theme.tint,borderRadius:8,paddingHorizontal:10,paddingVertical:4}}><T style={{color:theme.primary,fontSize:11,fontWeight:'700'}}>{ids.length}টি</T></View></View>{ids.length?ids.map(id=>{const b=p.allBooks.find(x=>x.id===id);return b&&<LibBookCard key={id} book={b} theme={theme} onPress={()=>p.open(id)}/> }):<Empty theme={theme}/>}</Page>}
function Categories(p:C){const theme=p.theme;const un=p.remoteNotices.filter(n=>!p.state.readNotifications.includes(n.id)).length;const[refreshing,setRefreshing]=useState(false);const doRefresh=async()=>{if(!p.syncRemote)return;setRefreshing(true);try{await p.syncRemote()}catch{}finally{setRefreshing(false)}};const skeletonColors=['#2AA876','#E85D75','#8B5CF6','#D97706','#3B82F6','#EC4899','#0891B2','#DC2626','#059669'];return <Page theme={theme} onRefresh={doRefresh} refreshing={refreshing}><Header title={tr(p,'categories')} sub={tr(p,'categoriesSub')} theme={theme} onNotif={()=>p.setScreen({type:'notifications'})} unreadCount={un}/>{!p.dataLoaded&&!p.allCategories.length?<View style={styles.catGrid}>{skeletonColors.map((c,i)=><View key={i} style={[styles.catCard,{opacity:0.6}]}><View style={[styles.catImgWrap]}><SkeletonPulse width="100%" height={120} borderRadius={0} style={{backgroundColor:c+'44'}}/></View></View>)}</View>:!p.allCategories.length?<Empty theme={theme}/>:<View style={styles.catGrid}>{p.allCategories.map(c=>{const count=p.allBooks.filter(b=>b.category===c[0]).length;const hasImg=Boolean(c[3]);const bookWord=count===1?copy(p.state.settings.language,'book'):copy(p.state.settings.language,'books');return <Pressable key={c[0]} onPress={()=>p.setScreen({type:'list',title:c[0],ids:p.allBooks.filter(b=>b.category===c[0]).map(b=>b.id)})} style={styles.catCard}><View style={[styles.catImgWrap]}>{hasImg?<Image source={{uri:c[3]!}} style={styles.catImg}/>:<View style={[styles.catImgFallback,{backgroundColor:c[2]}]}><T style={{color:'#fff',fontSize:28,fontWeight:'900',opacity:0.5}}>{c[0][0]}</T></View>}<View style={styles.catImgOverlay}><T numberOfLines={1} style={styles.catImgName}>{c[0]}</T></View></View><View style={[styles.catBadge,{backgroundColor:theme.tint}]}><T style={[styles.catBadgeText,{color:theme.primary}]}>{count} {bookWord}</T></View></Pressable>})}</View>}</Page>}
function Episodes(p:C){const un=p.remoteNotices.filter(n=>!p.state.readNotifications.includes(n.id)).length;const[refreshing,setRefreshing]=useState(false);const doRefresh=async()=>{if(!p.syncRemote)return;setRefreshing(true);try{await p.syncRemote()}catch{}finally{setRefreshing(false)}};return <Page theme={p.theme} onRefresh={doRefresh} refreshing={refreshing}><Header title={tr(p,'episodes')} sub={tr(p,'episodesSub')} theme={p.theme} onNotif={()=>p.setScreen({type:'notifications'})} unreadCount={un}/>{p.allBooks.map((b,i)=><Episode key={b.id} book={b} theme={p.theme} onPress={()=>p.read(b.id,b.chapters.length?(i+2)%b.chapters.length:0)}/>)}</Page>}
function Profile(p:C){
  const un=p.remoteNotices.filter(n=>!p.state.readNotifications.includes(n.id)).length;
  const t=p.theme;
  const favs=p.state.favorites.length,downs=p.state.downloads.length,hist=p.state.history.length;
  const lang=p.state.settings.language;

  const cardFade1=useRef(new Animated.Value(0)).current;
  const cardFade2=useRef(new Animated.Value(0)).current;
  const streakDots=[useRef(new Animated.Value(0)).current,useRef(new Animated.Value(0)).current,useRef(new Animated.Value(0)).current,useRef(new Animated.Value(0)).current,useRef(new Animated.Value(0)).current,useRef(new Animated.Value(0)).current,useRef(new Animated.Value(0)).current];
  const weekBars=[useRef(new Animated.Value(0)).current,useRef(new Animated.Value(0)).current,useRef(new Animated.Value(0)).current,useRef(new Animated.Value(0)).current,useRef(new Animated.Value(0)).current,useRef(new Animated.Value(0)).current,useRef(new Animated.Value(0)).current];
  const counterVal=useRef(new Animated.Value(0)).current;
  const[counterDisplay,setCounterDisplay]=useState(0);

  useEffect(()=>{
    Animated.stagger(120,[Animated.parallel([
      Animated.timing(cardFade1,{toValue:1,duration:500,useNativeDriver:true}),
      ...streakDots.map((d,i)=>Animated.spring(d,{toValue:1,delay:400+i*60,friction:6,useNativeDriver:true}))
    ]),Animated.parallel([
      Animated.timing(cardFade2,{toValue:1,duration:500,useNativeDriver:true}),
      ...weekBars.map((b,i)=>Animated.spring(b,{toValue:1,delay:500+i*80,friction:6,useNativeDriver:true}))
    ])]).start();
    const days=calcStreak(p.state.readingActivity);
    counterVal.setValue(counterDisplay);
    Animated.timing(counterVal,{toValue:days,duration:800,useNativeDriver:false}).start();
    counterVal.removeAllListeners();
    counterVal.addListener(({value})=>setCounterDisplay(Math.round(value)));
    return ()=>counterVal.removeAllListeners();
  },[p.state.readingActivity]);

  const streak=calcStreak(p.state.readingActivity);
  const weekMins=calcWeekMins(p.state.readingActivity);
  const weekEps=calcWeekEps(p.state.readingActivity);
  const getDayLabels=(l:Language)=>{
    const bn=['শনি','রবি','সোম','মঙ্ল','বুধ','বৃহ','শুক্র'];
    const en=['Sat','Sun','Mon','Tue','Wed','Thu','Fri'];
    const hi=['शनि','रवि','सोम','मंगल','बुध','बृह','शुक्र'];
    const arr=l==='bn'?bn:l==='hi'?hi:en;
    const today=new Date().getDay();
    const base=today===6?0:today+1;
    return Array.from({length:7},(_,i)=>arr[(base+i)%7]);
  };
  const dayLabels=getDayLabels(lang);
  const maxBar=Math.max(1,...[0,1,2,3,4,5,6].map(i=>{const d=new Date();d.setDate(d.getDate()-6+i);return p.state.readingActivity[d.toISOString().slice(0,10)]?.minutes||0}));

  return <Page theme={t}>
    <Header title={tr(p,'menu')} theme={t} onNotif={()=>p.setScreen({type:'notifications'})} unreadCount={un}/>
    <ScrollView showsVerticalScrollIndicator={false}>
    <Pressable onPress={()=>p.setScreen({type:'profileDetails'})} style={{flexDirection:'row',alignItems:'center',backgroundColor:t.card,borderRadius:14,padding:12,marginBottom:12,borderWidth:1,borderColor:t.line}}>
      {(p.state.writer?.avatar_url||p.state.user?.avatar_url)?<Image source={{uri:p.state.writer?.avatar_url||p.state.user?.avatar_url}} style={{width:42,height:42,borderRadius:21}}/>:<View style={{width:42,height:42,borderRadius:21,backgroundColor:t.tint,alignItems:'center',justifyContent:'center'}}>
        <T style={{fontSize:18,fontWeight:'900',color:t.primary}}>{(p.state.user?.display_name||p.state.writer?.writer_name||p.state.name||'?')[0]?.toUpperCase()}</T>
      </View>}
      <View style={{flex:1,marginLeft:12}}>
        <T numberOfLines={1} style={{fontSize:15,fontWeight:'800',color:t.ink}}>{p.state.user?.display_name||p.state.writer?.writer_name||p.state.name}</T>
        <T style={{fontSize:11,color:t.muted,marginTop:1}}>{p.state.writer?tr(p,'writerStudio'):tr(p,'regularReader')}</T>
      </View>
      <Feather name="chevron-right" size={18} color={t.muted}/>
    </Pressable>

    {/* === READING STREAK CARD === */}
    <Animated.View style={{opacity:cardFade1,transform:[{translateY:cardFade1.interpolate({inputRange:[0,1],outputRange:[12,0]})}],backgroundColor:t.tint,borderRadius:14,paddingHorizontal:12,paddingTop:10,paddingBottom:10,marginBottom:8,borderWidth:1,borderColor:t.line,shadowColor:t.primary,shadowOffset:{width:0,height:2},shadowOpacity:0.08,shadowRadius:6,elevation:2}}>
      <View style={{flexDirection:'row',alignItems:'center'}}>
        <View style={{width:34,height:34,borderRadius:10,backgroundColor:t.card,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:t.line}}>
          <Feather name="zap" size={16} color={t.primary}/>
        </View>
        <View style={{flex:1,marginLeft:10}}>
          <T style={{fontSize:13,fontWeight:'800',color:t.ink}}>{tr(p,'readingStreak')}</T>
          <T style={{fontSize:10,color:t.muted,marginTop:1}}>{tr(p,'keepItUp')}</T>
        </View>
        <View style={{alignItems:'center',backgroundColor:t.card,borderRadius:10,paddingHorizontal:10,paddingVertical:5,borderWidth:1,borderColor:t.line}}>
          <Animated.Text style={{fontSize:20,fontWeight:'900',color:t.primary}}>{counterDisplay}</Animated.Text>
          <T style={{fontSize:8,fontWeight:'800',color:t.muted,marginTop:-2}}>{tr(p,'days')}</T>
        </View>
      </View>
      <View style={{flexDirection:'row',justifyContent:'space-between',marginTop:10,paddingHorizontal:2}}>
        {[0,1,2,3,4,5,6].map(i=>{const d=new Date();d.setDate(d.getDate()-6+i);const k=d.toISOString().slice(0,10);const active=Boolean(p.state.readingActivity[k]?.episodes);const today=new Date().toISOString().slice(0,10);const isToday=k===today;return <Animated.View key={i} style={{alignItems:'center',gap:4,transform:[{scale:streakDots[i]}]}}>
          <View style={{width:24,height:24,borderRadius:12,backgroundColor:active?t.primary:isToday?t.card:`${t.primary}11`,alignItems:'center',justifyContent:'center',borderWidth:isToday?2:0,borderColor:isToday?t.primary:'transparent'}}>
            {active?<Feather name="check" size={10} color="#fff"/>:isToday&&<View style={{width:5,height:5,borderRadius:3,backgroundColor:t.primary}}/>}
          </View>
          <T style={{fontSize:8,fontWeight:isToday?'800':'600',color:isToday?t.ink:t.muted}}>{dayLabels[i]}</T>
        </Animated.View>})}
      </View>
    </Animated.View>

    {/* === WEEKLY READING CARD — compact analytics === */}
    <Animated.View style={{opacity:cardFade2,transform:[{translateY:cardFade2.interpolate({inputRange:[0,1],outputRange:[10,0]})}],backgroundColor:t.card,borderRadius:12,paddingHorizontal:12,paddingTop:10,paddingBottom:10,marginBottom:12,borderWidth:1,borderColor:t.line}}>
      <View style={{flexDirection:'row',alignItems:'center',marginBottom:8}}>
        <Feather name="bar-chart-2" size={12} color={t.primary}/>
        <T style={{fontSize:11,fontWeight:'800',color:t.ink,marginLeft:6}}>{tr(p,'yourReading')}</T>
        <T style={{fontSize:9,color:t.muted,marginLeft:'auto'}}>{tr(p,'weekSummary')}</T>
      </View>
      <View style={{flexDirection:'row',gap:6,marginBottom:8}}>
        <View style={{flex:1,flexDirection:'row',alignItems:'center',gap:6,backgroundColor:`${t.primary}08`,borderRadius:8,paddingHorizontal:10,paddingVertical:6}}>
          <Feather name="clock" size={12} color={t.primary}/>
          <View>
            <T style={{fontSize:15,fontWeight:'900',color:t.primary,lineHeight:17}}>{weekMins>=60?`${Math.floor(weekMins/60)}:${String(weekMins%60).padStart(2,'0')}`:weekMins}</T>
            <T style={{fontSize:8,fontWeight:'600',color:t.muted}}>{weekMins>=60?(p.state.settings.language==='bn'?'ঘন্টা পড়া হয়েছে':p.state.settings.language==='hi'?'घंटे पढ़े':copy(p.state.settings.language,'minRead')):copy(p.state.settings.language,'minRead')}</T>
          </View>
        </View>
        <View style={{flex:1,flexDirection:'row',alignItems:'center',gap:6,backgroundColor:`${t.primary}08`,borderRadius:8,paddingHorizontal:10,paddingVertical:6}}>
          <Feather name="book-open" size={12} color={t.primary}/>
          <View>
            <T style={{fontSize:15,fontWeight:'900',color:t.primary,lineHeight:17}}>{weekEps}</T>
            <T style={{fontSize:8,fontWeight:'600',color:t.muted}}>{tr(p,'episodesDone')}</T>
          </View>
        </View>
      </View>
      <View style={{flexDirection:'row',alignItems:'flex-end',justifyContent:'space-between',height:30,paddingHorizontal:1}}>
        {[0,1,2,3,4,5,6].map(i=>{const d=new Date();d.setDate(d.getDate()-6+i);const k=d.toISOString().slice(0,10);const m=p.state.readingActivity[k]?.minutes||0;const h=Math.max(2,Math.round(m/maxBar*24));const today=new Date().toISOString().slice(0,10);const isToday=k===today;return <Animated.View key={i} style={{alignItems:'center',flex:1,justifyContent:'flex-end',gap:2,transform:[{scaleY:weekBars[i]}]}}>
          <View style={{width:'55%',height:h,backgroundColor:m?t.primary:isToday?`${t.primary}15`:`${t.primary}08`,borderRadius:2,minHeight:2}}/>
          <T style={{fontSize:7,fontWeight:isToday?'800':'500',color:isToday?t.primary:t.muted}}>{dayLabels[i]}</T>
        </Animated.View>})}
      </View>
    </Animated.View>

    {/* === TOTAL READS (real-time from readingActivity) === */}
    {(() => {
      const ra = p.state.readingActivity;
      const totalMins = Object.values(ra).reduce((s: number, d: any) => s + (d.minutes || 0), 0);
      const totalEps = Object.values(ra).reduce((s: number, d: any) => s + (d.episodes || 0), 0);
      const hrs = Math.floor(totalMins / 60);
      const mins = totalMins % 60;
      return <View style={{flexDirection:'row',gap:8,marginBottom:12}}>
        <View style={{flex:1,alignItems:'center',paddingVertical:14,backgroundColor:t.card,borderRadius:14,borderWidth:1,borderColor:t.line}}>
          <T style={{fontSize:20,fontWeight:'900',color:t.primary}}>{hrs>0?`${hrs}:${String(mins).padStart(2,'0')}`:mins}</T>
          <T style={{fontSize:11,fontWeight:'700',color:t.muted,marginTop:2}}>{hrs>0?(p.state.settings.language==='bn'?'ঘন্টা পড়া':p.state.settings.language==='hi'?'घंटे पढ़े':'hrs read'):(p.state.settings.language==='bn'?'মিনিট পড়া':p.state.settings.language==='hi'?'मिनट पढ़े':'min read')}</T>
        </View>
        <View style={{flex:1,alignItems:'center',paddingVertical:14,backgroundColor:t.card,borderRadius:14,borderWidth:1,borderColor:t.line}}>
          <T style={{fontSize:20,fontWeight:'900',color:t.primary}}>{totalEps}</T>
          <T style={{fontSize:11,fontWeight:'700',color:t.muted,marginTop:2}}>{p.state.settings.language==='bn'?'মোট পাঠ':p.state.settings.language==='hi'?'कुल पठन':'Total Reads'}</T>
        </View>
      </View>;
    })()}

    <Pressable onPress={()=>p.setScreen({type:'writer'})} style={{flexDirection:'row',alignItems:'center',backgroundColor:t.card,borderRadius:14,padding:12,marginBottom:8,borderWidth:1,borderColor:t.line}}>
      {p.state.writer?.avatar_url?<Image source={{uri:p.state.writer.avatar_url}} style={{width:42,height:42,borderRadius:21}}/>:<View style={{width:42,height:42,borderRadius:21,backgroundColor:p.state.writer?t.primary:t.tint,alignItems:'center',justifyContent:'center'}}>
        {p.state.writer?<T style={{fontSize:18,fontWeight:'900',color:'#fff'}}>{p.state.writer.writer_name?.[0]?.toUpperCase()||'?'}</T>:<Feather name="edit-3" size={18} color={t.primary}/>}
      </View>}
      <View style={{flex:1,marginLeft:12}}>
        <T numberOfLines={1} style={{fontSize:15,fontWeight:'800',color:t.ink}}>{p.state.writer?p.state.writer.writer_name||tr(p,'writer'):tr(p,'writer')}</T>
        <T style={{fontSize:11,color:t.muted,marginTop:1}}>{p.state.writer?tr(p,'writerStudio'):tr(p,'writerStudioSub')}</T>
      </View>
      <Feather name="chevron-right" size={18} color={t.muted}/>
    </Pressable>

    <Pressable onPress={()=>p.setScreen({type:'followedWriters'})} style={{flexDirection:'row',alignItems:'center',backgroundColor:t.card,borderRadius:14,padding:12,marginBottom:12,borderWidth:1,borderColor:t.line}}>
      <View style={{width:42,height:42,borderRadius:21,backgroundColor:t.tint,alignItems:'center',justifyContent:'center'}}>
        <Feather name="users" size={18} color={t.primary}/>
      </View>
      <View style={{flex:1,marginLeft:12}}>
        <T numberOfLines={1} style={{fontSize:15,fontWeight:'800',color:t.ink}}>{tr(p,'followedWriters')}</T>
        <T style={{fontSize:11,color:t.muted,marginTop:1}}>{(p.state.followedWriters||[]).length} {tr(p,'writers')}</T>
      </View>
      <Feather name="chevron-right" size={18} color={t.muted}/>
    </Pressable>

    <Pressable onPress={()=>p.setScreen({type:'settings'})} style={{flexDirection:'row',alignItems:'center',backgroundColor:t.card,borderRadius:14,padding:12,marginBottom:12,borderWidth:1,borderColor:t.line}}>
      <View style={{width:42,height:42,borderRadius:21,backgroundColor:t.tint,alignItems:'center',justifyContent:'center'}}>
        <Feather name="settings" size={18} color={t.primary}/>
      </View>
      <View style={{flex:1,marginLeft:12}}>
        <T numberOfLines={1} style={{fontSize:15,fontWeight:'800',color:t.ink}}>{tr(p,'settings')}</T>
        <T style={{fontSize:11,color:t.muted,marginTop:1}}>{tr(p,'theme')}, {tr(p,'language')}</T>
      </View>
      <Feather name="chevron-right" size={18} color={t.muted}/>
    </Pressable>

    <T style={[styles.menuGroupTitle,{color:t.muted}]}>{tr(p,'aboutApp')}</T>
    <View style={[styles.menuGroup,{backgroundColor:t.card}]}>
      <Menu title={tr(p,'aboutApp')} icon="info" theme={t} onPress={()=>p.setScreen({type:'aboutApp'})}/>
      <Menu title={tr(p,'termsOfService')} icon="file-text" theme={t} onPress={()=>p.setScreen({type:'terms'})}/>
      <Menu title={tr(p,'shareApp')} icon="share-2" theme={t} onPress={()=>Share.share({message:'Lekhoni Kahini - Bengali stories app'})}/>
      <Menu title={tr(p,'rateApp')} icon="star" theme={t} onPress={()=>Alert.alert(tr(p,'rateApp'),tr(p,'appDesc'))}/>
    </View>
    </ScrollView>
  </Page>}

function calcStreak(a:Record<string,{minutes:number;episodes:number}>):number{let s=0;const today=new Date();for(let i=0;i<365;i++){const d=new Date(today);d.setDate(d.getDate()-i);if(a[d.toISOString().slice(0,10)]?.episodes)s++;else break}return s}
function calcWeekMins(a:Record<string,{minutes:number;episodes:number}>):number{let t2=0;const today=new Date();for(let i=0;i<7;i++){const d=new Date(today);d.setDate(d.getDate()-6+i);t2+=a[d.toISOString().slice(0,10)]?.minutes||0}return t2}
function calcWeekEps(a:Record<string,{minutes:number;episodes:number}>):number{let t2=0;const today=new Date();for(let i=0;i<7;i++){const d=new Date(today);d.setDate(d.getDate()-6+i);t2+=a[d.toISOString().slice(0,10)]?.episodes||0}return t2}

function ProfileDetails(p:C){
  const t=p.theme;
  const lang=p.state.settings.language;
  const favs=p.state.favorites.length;
  const downs=p.state.downloads.length;
  const hist=p.state.history.length;
  const favBooks=p.state.favorites.map(id=>p.allBooks.find(b=>b.id===id)).filter(Boolean) as Book[];
  const downBooks=p.state.downloads.map(id=>p.allBooks.find(b=>b.id===id)).filter(Boolean) as Book[];
  const histBooks=p.state.history.map(id=>p.allBooks.find(b=>b.id===id)).filter(Boolean) as Book[];
  const [editing,setEditing]=useState(false);
  const [nameInput,setNameInput]=useState(p.state.name);

  const isLoggedInAsWriter=!!p.state.writer;
  const isLoggedIn=isLoggedInAsWriter;

  const profileName=p.state.writer?.writer_name||p.state.name;
  const profileUsername=p.state.writer?.username;
  const profileAvatar=p.state.writer?.avatar_url;
  const isWriter=isLoggedInAsWriter;

  const sections:{title:string;icon:string;count:number;books:Book[];ids:string[]}[]=[
    {title:tr(p,'favorites'),icon:'heart',count:favs,books:favBooks,ids:p.state.favorites},
    {title:tr(p,'downloads'),icon:'download',count:downs,books:downBooks,ids:p.state.downloads},
    {title:tr(p,'history'),icon:'clock',count:hist,books:histBooks,ids:p.state.history},
  ];

  const logout=()=>{
    if(p.state.writer){p.update({writer:null,writerToken:null,followedWriters:[]})}
  };

  const titleText=isWriter?(lang==='hi'?'लेखक प्रोफ़ाइল':lang==='en'?'Writer Profile':'লেখক প্রোফাইল'):(isLoggedIn?(lang==='hi'?'नियमित पाठक':lang==='en'?'Regular Reader':'নিয়মিত পাঠক'):tr(p,'guestReader'));

  return <Page theme={t}>
    <Back title={titleText} theme={t} onPress={()=>p.setScreen({type:'main'})}/>
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={[styles.profileCard,{backgroundColor:t.card}]}>
        {profileAvatar?<Image source={{uri:profileAvatar}} style={{width:56,height:56,borderRadius:28,marginBottom:8}}/>:<View style={[styles.avatarBig,{backgroundColor:t.tint}]}><T style={{fontSize:28,fontWeight:'900',color:t.primary}}>{(profileName)[0]?.toUpperCase()||'?'}</T></View>}
        <T style={[styles.profileNameBig,{color:t.ink}]}>{profileName}</T>
        <T style={[styles.profileBadge,{color:t.muted}]}>{isLoggedInAsWriter?`@${profileUsername||''}`:tr(p,'regularReader')}</T>
        {isLoggedIn&&<Pressable onPress={logout} style={{marginTop:6,paddingHorizontal:12,paddingVertical:6,borderRadius:8,borderWidth:1,borderColor:'#EF4444'}}>
          <T style={{fontSize:11,fontWeight:'700',color:'#EF4444'}}>{lang==='hi'?'लॉग आउट':lang==='en'?'Logout':'লগআউট'}</T>
        </Pressable>}
        {!isLoggedIn&&!isWriter&&<Pressable onPress={()=>p.setScreen({type:'writer'})} style={{marginTop:6,paddingHorizontal:16,paddingVertical:8,borderRadius:10,backgroundColor:t.primary}}>
          <T style={{fontSize:12,fontWeight:'700',color:'#fff'}}>{lang==='hi'?'लॉग इन / साइन अप':lang==='en'?'Login / Sign Up':'লগইন / সাইনআপ'}</T>
        </Pressable>}
        <View style={[styles.profileStats,{backgroundColor:t.bg}]}>
          <View style={styles.profileStat}><T style={[styles.profileStatNum,{color:t.primary}]}>{favs}</T><T style={[styles.profileStatLabel,{color:t.muted}]}>{tr(p,'favorites')}</T></View>
          <View style={[styles.profileStat,{borderLeftWidth:1,borderLeftColor:t.line}]}><T style={[styles.profileStatNum,{color:t.primary}]}>{downs}</T><T style={[styles.profileStatLabel,{color:t.muted}]}>{tr(p,'downloads')}</T></View>
          <View style={[styles.profileStat,{borderLeftWidth:1,borderLeftColor:t.line}]}><T style={[styles.profileStatNum,{color:t.primary}]}>{hist}</T><T style={[styles.profileStatLabel,{color:t.muted}]}>{tr(p,'history')}</T></View>
        </View>
        {isLoggedInAsWriter&&<Pressable onPress={()=>{setNameInput(p.state.writer?.writer_name||p.state.name);setEditing(true)}} style={{marginTop:10,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,backgroundColor:t.tint,borderRadius:12,paddingHorizontal:14,paddingVertical:8}}>
          <Feather name="edit-2" size={14} color={t.primary}/><T style={{color:t.primary,fontWeight:'800',fontSize:13}}>{tr(p,'editName')}</T>
        </Pressable>}
      </View>

      {sections.map((sec,idx)=><Pressable key={idx} onPress={()=>{if(sec.ids.length)p.setScreen({type:'list',title:sec.title,ids:sec.ids})}} style={[styles.menuGroup,{backgroundColor:t.card,marginBottom:10}]}>
        <View style={{flexDirection:'row',alignItems:'center',paddingVertical:14,paddingHorizontal:16}}>
          <View style={{width:36,height:36,borderRadius:10,backgroundColor:t.tint,alignItems:'center',justifyContent:'center'}}>
            <Feather name={sec.icon as any} size={17} color={t.primary}/>
          </View>
          <View style={{flex:1,marginLeft:12}}>
            <T style={{fontSize:14,fontWeight:'800',color:t.ink}}>{sec.title}</T>
            <T style={{fontSize:11,color:t.muted,marginTop:1}}>{sec.count} {tr(p,'books')}</T>
          </View>
          <Feather name="chevron-right" size={18} color={t.muted}/>
        </View>
      </Pressable>)}
    </ScrollView>
  </Page>}

function AuthModal({theme,lang,onClose,onGoto}:{theme:Theme;lang:import('./src/types').Language;onClose:()=>void;onGoto:()=>void}){
  const tl=lang==='hi'?'खाता नहीं बना है':lang==='en'?'Account Not Created':'অ্যাকাউন্ট খোলা হয়নি';
  const bd=lang==='hi'?'आपका खाता अभी तक नहीं बना है। आप किसी को फ़ॉलो नहीं कर सकते और कोई आपको फ़ॉलो नहीं कर सकता।':lang==='en'?'Your account is not created yet. You cannot follow anyone or be followed by anyone.':'আপনার অ্যাকাউন্ট এখনো খোলা হয়নি। আপনি কাউকে ফলো করতে বা কেউ আপনাকে ফলো করতে পারবে না।';
  const bt=lang==='hi'?'लेखक पैनल में जाएं':lang==='en'?'Go to Writer Panel':'লেখক প্যানেলে যান';
  const cn=lang==='hi'?'रद्द करें':lang==='en'?'Cancel':'বাতিল';
  return <View style={{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'center',alignItems:'center',padding:24}}>
    <View style={{width:'100%',backgroundColor:theme.card,borderRadius:22,padding:24,alignItems:'center'}}>
      <View style={{width:56,height:56,borderRadius:28,backgroundColor:theme.tint,alignItems:'center',justifyContent:'center',marginBottom:14}}><Feather name="user-plus" size={24} color={theme.primary}/></View>
      <T style={{fontSize:17,fontWeight:'900',color:theme.ink,marginBottom:6,textAlign:'center'}}>{tl}</T>
      <T style={{fontSize:13,color:theme.muted,textAlign:'center',lineHeight:20,marginBottom:18}}>{bd}</T>
      <Pressable onPress={()=>{onClose();onGoto()}} style={{width:'100%',height:48,borderRadius:14,backgroundColor:theme.primary,alignItems:'center',justifyContent:'center',marginBottom:10}}>
        <T style={{fontSize:14,fontWeight:'800',color:'#fff'}}>{bt}</T>
      </Pressable>
      <Pressable onPress={onClose} style={{paddingVertical:8}}>
        <T style={{fontSize:13,fontWeight:'700',color:theme.muted}}>{cn}</T>
      </Pressable>
    </View>
  </View>;
}

function AllWritersList(p:C){
  const t=p.theme;
  const [q,setQ]=useState('');
  const [showAuth,setShowAuth]=useState(false);
  const followLog=useRef<Record<string,number[]>>({});
  const followedIds=new Set((p.state.followedWriters||[]).map(f=>f.id));
  const unfollowed=p.publicWriters.filter(w=>!followedIds.has(w.id));
  const filtered=q.trim()?unfollowed.filter(w=>`${w.writer_name} ${w.username}`.toLowerCase().includes(q.trim().toLowerCase())):unfollowed;
  const toggleFollow=async(w:import('./src/types').WriterProfile)=>{
    if(!p.state.writer&&!p.state.user){setShowAuth(true);return;}
    const now=Date.now();
    const log=followLog.current[w.id]||[];
    const recent=log.filter(t=>now-t<60000);
    if(recent.length>=4){Alert.alert(copy(p.state.settings.language,'reportSpam'),p.state.settings.language==='bn'?'অনুগ্রহ করে ১ মিনিট অপেক্ষা করুন।':p.state.settings.language==='hi'?'कृपया 1 मिनट प्रतीक्षा करें।':'Please wait 1 minute.');return;}
    followLog.current[w.id]=[...recent,now];
    const isFollowed=p.state.followedWriters.some(x=>x.id===w.id);
    if(isFollowed){
      p.update({followedWriters:p.state.followedWriters.filter(x=>x.id!==w.id)});
      const ok=await unfollowWriter(p.state.deviceId,w.id);
      if(!ok)p.update({followedWriters:[...p.state.followedWriters,w]});
    }else{
      p.update({followedWriters:[...p.state.followedWriters,w]});
      const ok=await followWriter(p.state.deviceId,w.id,p.state.writer?.id,p.state.user?.id);
      if(!ok)p.update({followedWriters:p.state.followedWriters.filter(x=>x.id!==w.id)});
    }
  };
  return <Page theme={t}>
    <Back title={tr(p,'popularAuthors')} theme={t} onPress={()=>p.setScreen({type:'main'})}/>
    <View style={{height:50,borderWidth:1,borderRadius:14,paddingHorizontal:14,marginBottom:16,flexDirection:'row',alignItems:'center',gap:10,backgroundColor:t.card,borderColor:t.line}}>
      <Feather name="search" size={17} color={t.muted}/>
      <TextInput value={q} onChangeText={setQ} placeholder={copy(p.state.settings.language,'search')} placeholderTextColor={t.muted+'88'} style={{flex:1,color:t.ink,fontSize:14,fontFamily:GF()}}/>
      {q.length>0&&<Pressable onPress={()=>setQ('')} hitSlop={8}><Feather name="x" size={16} color={t.muted}/></Pressable>}
    </View>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom:30}}>
      {filtered.length===0?
        <View style={{alignItems:'center',paddingVertical:60}}>
          <View style={{width:60,height:60,borderRadius:30,backgroundColor:t.tint,alignItems:'center',justifyContent:'center',marginBottom:14}}>
            <Feather name="users" size={26} color={t.muted}/>
          </View>
          <T style={{fontSize:14,fontWeight:'700',color:t.muted,textAlign:'center'}}>{tr(p,'noFollowedWriters')}</T>
        </View>
      :filtered.map(w=>{
        const isFollowed=p.state.followedWriters.some(x=>x.id===w.id);
        return <Pressable key={w.id} onPress={()=>p.setScreen({type:'writerProfile',writer:w})} style={{flexDirection:'row',alignItems:'center',backgroundColor:t.card,borderRadius:14,padding:12,marginBottom:8,borderWidth:1,borderColor:t.line}}>
          <View style={{width:48,height:48,borderRadius:24,backgroundColor:t.tint,alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
            {w.avatar_url?<Image source={{uri:w.avatar_url}} style={{width:48,height:48,borderRadius:24}}/>:<T style={{fontSize:20,fontWeight:'900',color:t.primary}}>{w.writer_name[0]?.toUpperCase()||'?'}</T>}
          </View>
          <View style={{flex:1,marginLeft:12}}>
            <View style={{flexDirection:'row',alignItems:'center',gap:5}}>
              <T numberOfLines={1} style={{fontSize:15,fontWeight:'800',color:t.ink}}>{w.writer_name}</T>
              <BadgeIcon badge={w.badge} size={16}/>
            </View>
            <T numberOfLines={1} style={{fontSize:12,color:t.muted,marginTop:2}}>@{w.username}</T>
          </View>
          <Pressable onPress={(e)=>{e.stopPropagation();toggleFollow(w)}} hitSlop={8} style={{paddingHorizontal:14,paddingVertical:8,borderRadius:10,backgroundColor:isFollowed?'transparent':t.primary,borderWidth:isFollowed?1.5:0,borderColor:t.line}}>
            <T style={{fontSize:12,fontWeight:'700',color:isFollowed?t.ink:'#fff'}}>{isFollowed?'ফলো করছেন':'ফলো করুন'}</T>
          </Pressable>
        </Pressable>})}
    </ScrollView>
    {showAuth&&<AuthModal theme={t} lang={p.state.settings.language} onClose={()=>setShowAuth(false)} onGoto={()=>p.setScreen({type:'writer'})}/>}
  </Page>
}

function FollowedWritersList(p:C){
  const t=p.theme;
  const [showAuth,setShowAuth]=useState(false);
  const writers=p.state.followedWriters||[];
  const followLog=useRef<Record<string,number[]>>({});
  const toggleFollow=async(wid:string)=>{
    if(!p.state.writer){setShowAuth(true);return;}
    const now=Date.now();
    const log=followLog.current[wid]||[];
    const recent=log.filter(t=>now-t<60000);
    if(recent.length>=4){Alert.alert(copy(p.state.settings.language,'reportSpam'),p.state.settings.language==='bn'?'অনুগ্রহ করে ১ মিনিট অপেক্ষা করুন।':p.state.settings.language==='hi'?'कृपया 1 मिनट प्रतीक्षा करें।':'Please wait 1 minute.');return;}
    followLog.current[wid]=[...recent,now];
    const fw=p.state.followedWriters||[];
    const isFollowed=fw.some(w=>w.id===wid);
    if(isFollowed){
      p.update({followedWriters:fw.filter(w=>w.id!==wid)});
      const ok=await unfollowWriter(p.state.deviceId,wid);
      if(!ok)p.update({followedWriters:[...fw,writers.find(x=>x.id===wid)!].filter(Boolean)});
    }else{
      const w=p.publicWriters.find(x=>x.id===wid)||writers.find(x=>x.id===wid);
      if(w){
        p.update({followedWriters:[...fw,w]});
        const ok=await followWriter(p.state.deviceId,wid,p.state.writer?.id);
        if(!ok)p.update({followedWriters:fw.filter(x=>x.id!==wid)});
      }
    }
  };
  return <Page theme={t}>
    <Back title={tr(p,'followedWriters')} theme={t} onPress={()=>p.setScreen({type:'main'})}/>
    {writers.length===0?
      <View style={{alignItems:'center',paddingVertical:60}}>
        <View style={{width:60,height:60,borderRadius:30,backgroundColor:t.tint,alignItems:'center',justifyContent:'center',marginBottom:14}}>
          <Feather name="users" size={26} color={t.muted}/>
        </View>
        <T style={{fontSize:14,fontWeight:'700',color:t.muted,textAlign:'center'}}>{tr(p,'noFollowedWriters')}</T>
      </View>
    :<ScrollView showsVerticalScrollIndicator={false}>
      {writers.map(w=><Pressable key={w.id} onPress={()=>p.setScreen({type:'writerProfile',writer:w})} style={{flexDirection:'row',alignItems:'center',backgroundColor:t.card,borderRadius:14,padding:12,marginBottom:8,borderWidth:1,borderColor:t.line}}>
        {w.avatar_url?<Image source={{uri:w.avatar_url}} style={{width:44,height:44,borderRadius:22}}/>:<View style={{width:44,height:44,borderRadius:22,backgroundColor:t.primary,alignItems:'center',justifyContent:'center'}}>
          <T style={{fontSize:18,fontWeight:'900',color:'#fff'}}>{w.writer_name[0]?.toUpperCase()||'?'}</T>
        </View>}
        <View style={{flex:1,marginLeft:12}}>
          <T numberOfLines={1} style={{fontSize:14,fontWeight:'800',color:t.ink}}>{w.writer_name} <BadgeIcon badge={w.badge} size={14}/></T>
          <T style={{fontSize:11,color:t.muted,marginTop:1}}>@{w.username}{w.follower_count?` · ${w.follower_count} ${tr(p,'followers')}`:''}</T>
        </View>
        <Pressable onPress={()=>toggleFollow(w.id)} style={{paddingHorizontal:14,paddingVertical:7,borderRadius:10,backgroundColor:t.tint}}>
          <T style={{fontSize:12,fontWeight:'800',color:t.primary}}>{tr(p,'unfollow')}</T>
        </Pressable>
      </Pressable>)}
    </ScrollView>}
    {showAuth&&<AuthModal theme={t} lang={p.state.settings.language} onClose={()=>setShowAuth(false)} onGoto={()=>p.setScreen({type:'writer'})}/>}
  </Page>}

function WriterProfileView(p:C&{writer:import('./src/types').WriterProfile}){
  const t=p.theme;const w=p.writer;
  const isFollowed=p.state.followedWriters.some(x=>x.id===w.id);
  const writerBooks=p.allBooks.filter(b=>b.author===w.writer_name);
  const published=writerBooks.length;
  const [liveTotalReads,setLiveTotalReads]=useState(writerBooks.reduce((s,b)=>s+(Math.round(parseFloat(String(b.views).replace(/[^0-9.]/g,''))||0)),0));
  useEffect(()=>{const sum=writerBooks.reduce((s,b)=>s+(Math.round(parseFloat(String(b.views).replace(/[^0-9.]/g,''))||0)),0);setLiveTotalReads(sum);},[writerBooks.length]);
  useEffect(()=>{fetch('https://lekhoni-admin-api.smdkawsar2.workers.dev/api/public/books').then(r=>r.json()).then((books:any)=>{const fresh=books.filter((b:any)=>b.author===w.writer_name);const sum=fresh.reduce((s:number,b:any)=>s+(b.views||0),0);if(sum>0)setLiveTotalReads(sum);}).catch(()=>{});},[]);
  const[phase,setPhase]=useState<'idle'|'spinning'|'followed'>(isFollowed?'followed':'idle');
  const[showAuth,setShowAuth]=useState(false);
  const spin=useRef(new Animated.Value(0)).current;
  const followLog=useRef<Record<string,number[]>>({});
  const [liveFollowers,setLiveFollowers]=useState(w.follower_count||0);
  useEffect(()=>{setLiveFollowers(w.follower_count||0);fetch('https://lekhoni-admin-api.smdkawsar2.workers.dev/api/public/writers').then(r=>r.json()).then((writers:any)=>{const fw=writers.find((x:any)=>x.id===w.id);if(fw)setLiveFollowers(fw.follower_count||0);}).catch(()=>{});},[w.id,w.follower_count]);
  useEffect(()=>{setPhase(isFollowed?'followed':'idle')},[isFollowed]);
  const doFollow=async()=>{
    if(!p.state.writer&&!p.state.user){setShowAuth(true);return;}
    const now=Date.now();const log=followLog.current[w.id]||[];const recent=log.filter(t=>now-t<60000);
    if(recent.length>=4){Alert.alert(copy(p.state.settings.language,'reportSpam'),p.state.settings.language==='bn'?'অনুগ্রহ করে ১ মিনিট অপেক্ষা করুন।':p.state.settings.language==='hi'?'कृपया 1 मिनट प्रतीक्षा करें।':'Please wait 1 minute.');return;}
    followLog.current[w.id]=[...recent,now];
    setPhase('spinning');
    setLiveFollowers(prev=>prev+1);
    spin.setValue(0);
    Animated.timing(spin,{toValue:1,duration:1500,easing:Easing.linear,useNativeDriver:true}).start();
    p.update({followedWriters:[...p.state.followedWriters,w]});
    const ok=await followWriter(p.state.deviceId,w.id,p.state.writer?.id,p.state.user?.id);
    setTimeout(()=>{spin.stopAnimation();spin.setValue(0);setPhase(ok?'followed':'idle')},1800);
    if(!ok){p.update({followedWriters:p.state.followedWriters.filter(x=>x.id!==w.id)});setLiveFollowers(prev=>Math.max(0,prev-1));}
  };
  const doUnfollow=async()=>{
    setLiveFollowers(prev=>Math.max(0,prev-1));
    p.update({followedWriters:p.state.followedWriters.filter(x=>x.id!==w.id)});
    setPhase('idle');
    const ok=await unfollowWriter(p.state.deviceId,w.id);
    if(!ok){p.update({followedWriters:[...p.state.followedWriters,w]});setPhase('followed');setLiveFollowers(prev=>prev+1);}
  };
  const spinDeg=spin.interpolate({inputRange:[0,1],outputRange:['0deg','360deg']});
  return <Page theme={t}>
    <Back title={tr(p,'writer')} theme={t} onPress={()=>p.setScreen({type:'main'})}/>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom:30}}>
      <View style={{alignItems:'center',paddingTop:10,marginBottom:20}}>
        {w.avatar_url?<Image source={{uri:w.avatar_url}} style={{width:100,height:100,borderRadius:24,backgroundColor:t.tint}}/>:<View style={{width:100,height:100,borderRadius:24,backgroundColor:t.tint,alignItems:'center',justifyContent:'center'}}><T style={{fontSize:40,fontWeight:'900',color:t.primary}}>{w.writer_name[0]?.toUpperCase()||'?'}</T></View>}
        <View style={{flexDirection:'row',alignItems:'center',gap:6}}>
          <T style={{fontSize:22,fontWeight:'900',color:t.ink}}>{w.writer_name}</T>
          <BadgeIcon badge={w.badge} size={22}/>
        </View>
        <T style={{fontSize:13,fontWeight:'500',color:t.muted,marginTop:3}}>@{w.username}</T>
        {w.bio&&<T style={{fontSize:13,color:t.muted,marginTop:8,textAlign:'center',lineHeight:20,maxWidth:300}}>{w.bio}</T>}
      </View>
      <View style={{flexDirection:'row',marginHorizontal:16,marginBottom:16}}>
        <View style={{flex:1,alignItems:'center',paddingVertical:14,backgroundColor:t.card,borderRadius:14,borderWidth:1,borderColor:t.line}}>
          <T style={{fontSize:20,fontWeight:'900',color:t.primary}}>{published}</T>
          <T style={{fontSize:11,fontWeight:'700',color:t.muted,marginTop:2}}>{tr(p,'publishedCount')}</T>
        </View>
        <View style={{width:8}}/>
        <View style={{flex:1,alignItems:'center',paddingVertical:14,backgroundColor:t.card,borderRadius:14,borderWidth:1,borderColor:t.line}}>
          <T style={{fontSize:20,fontWeight:'900',color:t.primary}}>{liveTotalReads}</T>
          <T style={{fontSize:11,fontWeight:'700',color:t.muted,marginTop:2}}>{tr(p,'totalReads')}</T>
        </View>
        <View style={{width:8}}/>
        <View style={{flex:1,alignItems:'center',paddingVertical:14,backgroundColor:t.card,borderRadius:14,borderWidth:1,borderColor:t.line}}>
          <T style={{fontSize:20,fontWeight:'900',color:t.primary}}>{liveFollowers}</T>
          <T style={{fontSize:11,fontWeight:'700',color:t.muted,marginTop:2}}>{tr(p,'followers')}</T>
        </View>
      </View>
      {phase==='spinning'?<View style={{marginHorizontal:16,height:48,borderRadius:14,backgroundColor:t.tint,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,marginBottom:6}}>
        <Animated.View style={{transform:[{rotate:spinDeg}]}}><Feather name="loader" size={16} color={t.primary}/></Animated.View>
        <T style={{fontSize:14,fontWeight:'800',color:t.primary}}>{tr(p,'follow')}</T>
      </View>:<Pressable onPress={phase==='followed'?doUnfollow:doFollow} style={{marginHorizontal:16,height:48,borderRadius:14,backgroundColor:phase==='followed'?t.bg:t.primary,borderWidth:phase==='followed'?1.5:0,borderColor:t.line,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,marginBottom:6}}>
        <Feather name={phase==='followed'?'user-check':'user-plus'} size={16} color={phase==='followed'?t.ink:'#fff'}/>
        <T style={{fontSize:14,fontWeight:'800',color:phase==='followed'?t.ink:'#fff'}}>{phase==='followed'?'ফলো করছেন':tr(p,'follow')}</T>
      </Pressable>}
      <T style={{fontSize:11,color:t.muted,textAlign:'center',marginBottom:20,lineHeight:17,paddingHorizontal:28}}>{tr(p,'followHint')}</T>
      {writerBooks.length>0&&<>
        <View style={{flexDirection:'row',alignItems:'center',marginHorizontal:16,marginBottom:12}}>
          <T style={{fontSize:16,fontWeight:'900',color:t.ink,flex:1}}>{tr(p,'storiesBy')} {w.writer_name}</T>
          <T style={{fontSize:12,fontWeight:'700',color:t.muted}}>{published} {tr(p,'books')}</T>
        </View>
        {writerBooks.map(b=><Row key={b.id} book={b} theme={t} onPress={()=>p.open(b.id)}/>)}
      </>}
    </ScrollView>
    {showAuth&&<AuthModal theme={t} lang={p.state.settings.language} onClose={()=>setShowAuth(false)} onGoto={()=>p.setScreen({type:'writer'})}/>}
  </Page>}

function Search(p:C){const [q,setQ]=useState('');const books=q?p.allBooks.filter(b=>`${b.title}${b.author}${b.category}`.includes(q)):p.allBooks.slice(0,3);const writers=q?p.publicWriters.filter(w=>`${w.writer_name}${w.username||''}`.includes(q)):[];return <Page theme={p.theme}><Back title="অনুসন্ধান" theme={p.theme} onPress={()=>p.setScreen({type:'main'})}/><View style={[styles.search,{backgroundColor:p.theme.card,borderColor:p.theme.line}]}><Feather name="search" size={18} color={p.theme.muted}/><TextInput autoFocus value={q} onChangeText={setQ} placeholder="বই, লেখক বা বিভাগ খুঁজুন" placeholderTextColor={p.theme.muted} style={{flex:1,color:p.theme.ink,fontFamily:GF()}}/></View>{writers.length>0&&<><T style={[styles.group,{color:p.theme.muted}]}>লেখক</T>{writers.map(w=><Pressable key={w.id} onPress={()=>p.setScreen({type:'writerProfile',writer:w})} style={{flexDirection:'row',alignItems:'center',gap:12,backgroundColor:p.theme.card,borderRadius:14,padding:12,marginBottom:8,borderWidth:1,borderColor:p.theme.line}}>{w.avatar_url?<Image source={{uri:w.avatar_url}} style={{width:42,height:42,borderRadius:21}}/>:<View style={{width:42,height:42,borderRadius:21,backgroundColor:p.theme.tint,alignItems:'center',justifyContent:'center'}}><Feather name="user" size={18} color={p.theme.primary}/></View>}<View style={{flex:1}}><T numberOfLines={1} style={{color:p.theme.ink,fontWeight:'700',fontSize:14}}>{w.writer_name}</T><T numberOfLines={1} style={{color:p.theme.muted,fontSize:12,marginTop:2}}>{w.bio||'লেখক'}</T></View><Feather name="chevron-right" size={16} color={p.theme.muted}/></Pressable>)}</>}<T style={[styles.group,{color:p.theme.muted}]}>{q?`${books.length}টি ফলাফল`:'জনপ্রিয় বই'}</T>{books.map(b=><Row key={b.id} book={b} theme={p.theme} onPress={()=>{p.update({searchHistory:[q,...p.state.searchHistory.filter(x=>x!==q)].filter(Boolean)});p.open(b.id)}}/>)}{!books.length&&!writers.length&&<Empty theme={p.theme}/>}</Page>}
function Notifications(p:C){const t=p.theme;const[selNotif,setSelNotif]=useState<{id:string;title:string;body:string;icon:string;url:string;story_cover:string;time:string}|null>(null);const allNotices=p.remoteNotices.map(n=>({id:n.id,title:n.title,body:n.body,icon:n.icon,url:n.url,story_cover:n.story_cover||'',time:n.time}));const iconBg=t.primary+'22';
  const openDetail=(n:{id:string;title:string;body:string;icon:string;url:string;story_cover:string;time:string})=>{p.update({readNotifications:[...new Set([...p.state.readNotifications,n.id])]});setSelNotif(n)};
  const hasLink=selNotif?.url&&selNotif.url.trim();
  const openLink=()=>{if(!selNotif)return;let u=selNotif.url.trim();if(u&&!/^https?:\/\//i.test(u))u='https://'+u;Linking.openURL(u).catch(()=>{})};
  if(selNotif)return <Page theme={t}><Back title={tr(p,'notificationsTitle')} theme={t} onPress={()=>setSelNotif(null)}/><ScrollView showsVerticalScrollIndicator={false}>
    <View style={{alignItems:'center',marginBottom:20}}>
      {selNotif.story_cover?<Image source={{uri:selNotif.story_cover}} style={{width:80,height:110,borderRadius:12,marginBottom:12}} resizeMode="cover"/>:<View style={{width:56,height:56,borderRadius:16,backgroundColor:iconBg,alignItems:'center',justifyContent:'center',marginBottom:12}}><Feather name={selNotif.icon as any} size={26} color={t.primary}/></View>}
      <T style={{fontSize:18,fontWeight:'900',color:t.ink,textAlign:'center'}}>{selNotif.title}</T>
      <T style={{fontSize:12,color:t.muted,marginTop:4}}>{selNotif.time}</T>
    </View>
    <View style={{backgroundColor:t.card,borderRadius:16,padding:18,borderWidth:1,borderColor:t.line}}>
      <T style={{fontSize:15,color:t.ink,lineHeight:24}}>{selNotif.body}</T>
    </View>
    {hasLink&&<Pressable onPress={openLink} style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,marginTop:16,backgroundColor:t.primary+'15',borderRadius:12,paddingVertical:14,borderWidth:1,borderColor:t.primary+'30'}}>
      <Feather name="external-link" size={16} color={t.primary}/><T style={{fontSize:14,fontWeight:'700',color:t.primary}}>{tr(p,'openLink')}</T>
    </Pressable>}
  </ScrollView></Page>;
  const list=allNotices.map(n=>{const isRead=p.state.readNotifications.includes(n.id);return <Pressable key={n.id} onPress={()=>openDetail(n)} style={[styles.notifCard,{backgroundColor:isRead?t.card:t.tint,borderColor:t.line,borderLeftColor:isRead?t.line:t.primary,borderLeftWidth:isRead?1:3}]}>
    {n.story_cover?<Image source={{uri:n.story_cover}} style={{width:36,height:48,borderRadius:6,marginRight:10}} resizeMode="cover"/>:<View style={[styles.notifIconWrap,{backgroundColor:isRead?t.line:iconBg}]}><Feather name={I(n.icon)} size={20} color={isRead?t.muted:t.primary}/></View>}
    <View style={{flex:1}}>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
        <T numberOfLines={1} style={[styles.notifTitle,{color:isRead?t.muted:t.ink}]}>{n.title}</T>
        {!isRead&&<View style={[styles.notifLiveDot,{backgroundColor:t.primary}]}/>}
      </View>
      <T numberOfLines={2} style={[styles.notifBody,{color:t.muted}]}>{n.body}</T>
      <T style={[styles.notifTime,{color:isRead?t.line:t.primary,marginTop:6}]}>{n.time}</T>
    </View>
  </Pressable>});
  return <Page theme={t}><Back title={tr(p,'notificationsTitle')} theme={t} onPress={()=>p.setScreen({type:'main'})}/>
    {list.length?<ScrollView showsVerticalScrollIndicator={false}>{list}</ScrollView>:
    <View style={{alignItems:'center',justifyContent:'center',minHeight:400}}><Feather name="bell-off" size={32} color={t.line}/><T style={{color:t.muted,marginTop:10}}>{tr(p,'noNotifications')}</T></View>}
  </Page>}
function BookList(p:C&{title:string;ids:string[]}){return <Page theme={p.theme}><Back title={p.title} theme={p.theme} onPress={()=>p.setScreen({type:'main'})}/><T style={{color:p.theme.muted,marginBottom:15}}>{p.ids.length}টি বই</T>{p.ids.length?p.ids.map(id=>{const b=p.allBooks.find(x=>x.id===id);return b&&<Row key={id} book={b} theme={p.theme} onPress={()=>p.open(id)}/>}):<Empty theme={p.theme}/>}</Page>}
const dStyles=StyleSheet.create({
 hero:{borderRadius:26,overflow:'hidden',marginBottom:18,elevation:5,shadowColor:'#000',shadowOpacity:.28,shadowRadius:12,shadowOffset:{width:0,height:6}},
 heroHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingTop:14,zIndex:3},
 backBtn:{width:40,height:40,borderRadius:20,backgroundColor:'#00000038',alignItems:'center',justifyContent:'center',borderWidth:1},
 heroShare:{width:40,height:40,borderRadius:20,backgroundColor:'#0000002E',alignItems:'center',justifyContent:'center'},
 heroRow:{flexDirection:'row',alignItems:'flex-end',padding:18,paddingTop:6,gap:16,zIndex:2},
 coverCard:{borderRadius:12,elevation:6,shadowColor:'#000',shadowOpacity:.4,shadowRadius:12,shadowOffset:{width:0,height:6}},
 heroInfo:{flex:1,paddingBottom:4},
 heroCat:{alignSelf:'flex-start',borderRadius:8,paddingHorizontal:10,paddingVertical:5,flexDirection:'row',alignItems:'center',gap:5},
 heroTitle:{color:'#fff',fontSize:21,lineHeight:27,fontWeight:'900',marginTop:10},
 heroAuthor:{color:'#E8F2EE',fontSize:13,fontWeight:'700',marginTop:4},
 heroMeta:{flexDirection:'row',alignItems:'center',flexWrap:'wrap',gap:8,marginTop:12},
 chip:{flexDirection:'row',alignItems:'center',gap:4,backgroundColor:'#00000030',borderRadius:8,paddingHorizontal:8,paddingVertical:4},
 chipT:{color:'#fff',fontSize:11,fontWeight:'800'},
 actionRow:{flexDirection:'row',gap:8,marginVertical:16},
 actionCard:{flex:1,borderRadius:16,paddingVertical:12,alignItems:'center',justifyContent:'center',borderWidth:1,gap:4},
 actionIconTxt:{fontSize:10,fontWeight:'800'},
 readBtn:{height:56,borderRadius:18,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,marginTop:2,elevation:3,shadowColor:'#000',shadowOpacity:.22,shadowRadius:8,shadowOffset:{width:0,height:4}},
 readBtnTxt:{color:'#fff',fontWeight:'900',fontSize:16},
 sumCard:{borderRadius:18,padding:16,borderWidth:1},
 chapter:{minHeight:70,borderRadius:16,borderWidth:1,padding:12,marginBottom:10,flexDirection:'row',alignItems:'center',gap:12},
 numGrad:{width:44,height:44,borderRadius:13,alignItems:'center',justifyContent:'center'},
 cmtInput:{flex:1,minHeight:44,maxHeight:90,borderRadius:13,borderWidth:1,paddingHorizontal:12,paddingTop:11,fontSize:13,fontFamily:'HindSiliguriMedium'},
 postBtn:{borderRadius:13,paddingHorizontal:14,height:44,alignItems:'center',justifyContent:'center'},
 cmtItem:{flexDirection:'row',gap:11,marginTop:14,alignItems:'flex-start'},
 
 shareBtn:{height:56,borderWidth:1,borderRadius:16,marginTop:14,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10},
 miniBtn:{width:52,borderRadius:16,paddingVertical:14,alignItems:'center',justifyContent:'center',borderWidth:1},
 dlBtn:{height:52,borderRadius:16,marginTop:14,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},
 dlTrack:{height:8,borderRadius:5,marginTop:10,overflow:'hidden',width:'100%'},
 dlFill:{height:8,borderRadius:5},
 chIcon:{width:46,height:46,borderRadius:13,alignItems:'center',justifyContent:'center'},
 ytBtn:{width:44,height:44,borderRadius:22,alignItems:'center',justifyContent:'center',borderWidth:1.5},
 dlCard:{height:58,borderRadius:18,borderWidth:1,marginTop:14,flexDirection:'row',alignItems:'center',gap:12,paddingHorizontal:16},
 composer:{flexDirection:'row',alignItems:'center',gap:10,borderWidth:1,borderRadius:16,padding:10,marginBottom:6},
 avatar2:{width:36,height:36,borderRadius:18,alignItems:'center',justifyContent:'center'},
 nav:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:14,gap:10},
 navBtn:{width:42,height:42,borderRadius:14,alignItems:'center',justifyContent:'center',borderWidth:1},
 navTitle:{flex:1,fontSize:16,fontWeight:'900'},
 panel:{borderRadius:24,overflow:'hidden',borderWidth:1,marginBottom:16,elevation:5,shadowColor:'#000',shadowOpacity:.22,shadowRadius:12,shadowOffset:{width:0,height:6}},
 storyCard:{flexDirection:'row',alignItems:'center',gap:16,padding:16,zIndex:2},
 coverBox:{borderRadius:14,elevation:6,shadowColor:'#000',shadowOpacity:.4,shadowRadius:10,shadowOffset:{width:0,height:5}},
 storyInfo:{flex:1},
 statusBadge:{alignSelf:'flex-start',flexDirection:'row',alignItems:'center',gap:5,borderRadius:8,paddingHorizontal:9,paddingVertical:4},
 storyTitle:{color:'#fff',fontSize:17,lineHeight:22,fontWeight:'900',marginTop:8},
 storyAuthor:{color:'#E8F1EE',fontSize:12.5,fontWeight:'700',marginTop:5},
 tagRow:{flexDirection:'row',alignItems:'center',flexWrap:'wrap',gap:7,marginTop:11},
 miniTag:{flexDirection:'row',alignItems:'center',gap:4,borderRadius:8,paddingHorizontal:8,paddingVertical:4},
 miniTagT:{color:'#fff',fontSize:10.5,fontWeight:'800'},
 interRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-around',gap:6,borderWidth:1,borderRadius:20,paddingVertical:10,paddingHorizontal:8,marginBottom:14},
 statItem:{flexDirection:'row',alignItems:'center',gap:5},
 statVal:{fontWeight:'900',fontSize:13.5},
  numBadge:{width:34,height:34,borderRadius:11,alignItems:'center',justifyContent:'center'},

  writerCard:{width:152,borderRadius:20,borderWidth:1,overflow:'visible'},
  writerCardBg:{height:64,borderTopLeftRadius:20,borderTopRightRadius:20},
  writerAvatarWrap:{alignItems:'center',marginTop:-34,marginBottom:8},
  writerAvatar:{width:68,height:68,borderRadius:34,borderWidth:3,alignItems:'center',justifyContent:'center',overflow:'hidden'},
  writerCardBody:{alignItems:'center',paddingHorizontal:14,paddingBottom:14},
  writerName:{fontSize:14.5,fontWeight:'900',textAlign:'center'},
  writerUsername:{fontSize:11.5,fontWeight:'500',marginTop:2,textAlign:'center'},
  writerStatsRow:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:12,marginTop:10,paddingTop:10,borderTopWidth:1},
  writerStat:{flexDirection:'row',alignItems:'center',gap:3},
  writerStatNum:{fontSize:12,fontWeight:'800'},
  writerStatLabel:{fontSize:10,fontWeight:'600'},
  avatar:{width:36,height:36,borderRadius:12,alignItems:'center',justifyContent:'center'}
 });
function Details(p:C&{book:Book}){const b0=p.book;if(!b0)return <Page theme={p.theme}><Back title={tr(p,'details')} theme={p.theme} onPress={()=>p.setScreen({type:'main'})}/><Empty theme={p.theme}/></Page>;
  const[fullBook,setFullBook]=useState<Book|null>(null);
  const b=fullBook||b0;
  useEffect(()=>{if(b0.chapters.length===0&&b0.id){fetchRemoteBook(b0.id).then(r=>{if(r)setFullBook(r)}).catch(()=>{})}},[b0.id]);
  useEffect(()=>{if(fullBook){setLikes(fullBook.likes||0)}},[fullBook?.id]);
  const t=p.theme,accent=b.accent||'#F5C660',base=b.color||'#123E39',dark=shade(base,-34);
  const fav=p.state.favorites.includes(b.id),isOffline=!!p.dlBooks[b.id],down=p.state.downloads.includes(b.id)||isOffline;
  const haveContent=b.chapters.length>0&&b.chapters.some(c=>c.body&&c.body.trim().length>0);
  const rxn=p.state.reactions[b.id];
  const [likes,setLikes]=useState<number>(b.likes||0);const [liked,setLiked]=useState<boolean>(rxn==='like');const [disliked,setDisliked]=useState<boolean>(rxn==='dislike');
  const [cmtCount,setCmtCount]=useState<number|null>(null);
  const [dlPct,setDlPct]=useState<number|null>(null);const dlTimer=useRef<any>(null);
  const likeAnim=useRef(new Animated.Value(1)).current;
  const fade=useRef(new Animated.Value(0)).current;
  useEffect(()=>{Animated.timing(fade,{toValue:1,duration:520,useNativeDriver:true}).start();fetchRemoteComments(b.id).then(c=>{if(c&&Array.isArray(c))setCmtCount(c.length)});return()=>{if(dlTimer.current)clearInterval(dlTimer.current)}},[b.id]);
  const setRxn=(v:'like'|'dislike'|undefined)=>{const rx={...p.state.reactions};if(v)rx[b.id]=v;else delete rx[b.id];p.update({reactions:rx})};
  const bumpLike=()=>{likeAnim.setValue(0.4);Animated.spring(likeAnim,{toValue:1,friction:3,tension:170,useNativeDriver:true}).start()};
  const doLike=()=>{if(liked){setLiked(false);setLikes(l=>Math.max(0,l-1));setRxn(undefined);Vibration.vibrate(30);toggleBookLike(p.state.deviceId,b.id,false).then(r=>{if(r>=0)setLikes(r)});}else{setLiked(true);setDisliked(false);setLikes(l=>l+1);setRxn('like');Vibration.vibrate([0,40,40,80]);bumpLike();toggleBookLike(p.state.deviceId,b.id,true).then(r=>{if(r>=0)setLikes(r)});}};
  const doDislike=()=>{if(disliked){setDisliked(false);setRxn(undefined);}else{setDisliked(true);setLiked(false);setRxn('dislike');Vibration.vibrate([0,40]);}};
  const likeScale=likeAnim.interpolate({inputRange:[0,1],outputRange:[0.5,1]});
  const doDownload=()=>{if(isOffline){p.removeDownload(b.id);return}if(!haveContent){Alert.alert(tr(p,'details'),p.state.settings.language==='bn'?'এই বইটিতে এখনো পড়ার মতো কোনো অধ্যায় নেই। যুক্ত হলে ডাউনলোড করা যাবে।':p.state.settings.language==='hi'?'इस किताब में अभी पढ़ने लायक कोई अध्याय नहीं है। जोड़ने पर डाउनलोड हो जाएगा।':'This book has no readable chapters yet. It will be downloadable once chapters are added.');return}if(dlPct!==null)return;let pct=0;setDlPct(0);Vibration.vibrate(30);dlTimer.current=setInterval(()=>{pct+=Math.random()*6+5;if(pct>=100){pct=100;clearInterval(dlTimer.current);dlTimer.current=null;setDlPct(100);p.downloadBook(b.id);Vibration.vibrate([0,40,40,80]);setTimeout(()=>setDlPct(null),1600)}else setDlPct(Math.floor(pct))},110)};
  const goComments=()=>p.setScreen({type:'comments',id:b.id});const readAll=()=>p.read(b.id,0);
  const writer=p.publicWriters.find((x:import('./src/types').WriterProfile)=>x.writer_name===b.author);
  const toggleFav=()=>{Vibration.vibrate(20);fav?p.update({favorites:p.state.favorites.filter(x=>x!==b.id)}):p.update({favorites:[...p.state.favorites,b.id]})};
  const goWriter=()=>{if(writer){p.setScreen({type:'writerProfile',writer})}else{p.setScreen({type:'writerProfile',writer:{id:b.id,username:b.author,writer_name:b.author,bio:'',avatar_url:null,follower_count:0,badge:'none'}})}};
  const lastChapter=p.state.positions?.[b.id+'_lastChapter']??-1;const hasStarted=lastChapter>=0;const continueIdx=hasStarted?lastChapter:0;
  const [showMoreMenu,setShowMoreMenu]=useState(false);
  const [showReport,setShowReport]=useState(false);
  const [reportReason,setReportReason]=useState('');
  const [reportDetails,setReportDetails]=useState('');
  const [reportSent,setReportSent]=useState(false);
  const [reporting,setReporting]=useState(false);
  const doReport=async()=>{if(!reportReason||reporting)return;setReporting(true);try{const r=await submitReport(b.id,reportReason,reportDetails,p.state.deviceId,p.state.name||'Anonymous');setReporting(false);if(r?.ok){setReportSent(true);setTimeout(()=>{setShowReport(false);setReportSent(false);setReportReason('');setReportDetails('')},2000)}else{Alert.alert(tr(p,'report'),r?.error||tr(p,'reportError'))}}catch{setReporting(false);Alert.alert(tr(p,'report'),tr(p,'reportError'))}};
  return <Page theme={t}>
    <Animated.View style={{opacity:fade}}>
      <View style={dStyles.nav}>
        <Pressable onPress={()=>p.setScreen({type:'main'})} hitSlop={10} style={[dStyles.navBtn,{backgroundColor:t.card,borderColor:t.line}]}><Feather name="arrow-left" size={19} color={t.ink}/></Pressable>
        <T numberOfLines={1} style={[dStyles.navTitle,{color:t.ink}]}>{b.title}</T>
        <Pressable onPress={toggleFav} hitSlop={8} style={[dStyles.navBtn,{backgroundColor:fav?'#EF4444':t.card,borderColor:fav?'#EF4444':t.line}]}><Feather name="heart" size={17} color={fav?'#fff':t.ink}/></Pressable>
        <Pressable onPress={()=>setShowMoreMenu(true)} hitSlop={8} style={[dStyles.navBtn,{backgroundColor:t.card,borderColor:t.line}]}><Feather name="more-vertical" size={17} color={t.ink}/></Pressable>
      </View>
      <View style={[dStyles.panel,{borderColor:'#00000022'}]}>
        <LinearGradient colors={[base,dark]} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFill}/>
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          <Circle cx="90%" cy={-10} r={100} fill={accent+'25'}/>
          <Ellipse cx="8%" cy={220} rx={120} ry={70} fill={accent+'18'}/>
          <Circle cx="75%" cy={190} r={55} fill="#ffffff0A"/>
        </Svg>
        <View style={dStyles.storyCard}>
          <View style={dStyles.coverBox}><Cover book={b}/></View>
          <View style={dStyles.storyInfo}>
            <View style={{flexDirection:'row',alignItems:'center',gap:6,flexWrap:'wrap'}}>
              <View style={[dStyles.statusBadge,{backgroundColor:accent+'2E'}]}><Feather name={I(b.categoryIcon)} size={11} color={accent}/><T style={{color:accent,fontSize:10.5,fontWeight:'900'}}>{b.category||tr(p,'chapters')}</T></View>
              {b.writer_status==='ongoing'&&<View style={[dStyles.statusBadge,{backgroundColor:'#10B9812E'}]}><Feather name="loader" size={10} color="#10B981"/><T style={{color:'#10B981',fontSize:10,fontWeight:'900'}}>{copy(p.state.settings.language,'statusOngoing')}</T></View>}
              {b.writer_status==='complete'&&<View style={[dStyles.statusBadge,{backgroundColor:'#F59E0B2E'}]}><Feather name="check-circle" size={10} color="#F59E0B"/><T style={{color:'#F59E0B',fontSize:10,fontWeight:'900'}}>{copy(p.state.settings.language,'statusComplete')}</T></View>}
            </View>
            <T numberOfLines={2} style={dStyles.storyTitle}>{b.title}</T>
            <Pressable onPress={goWriter} style={{flexDirection:'row',alignItems:'center',gap:6,marginTop:2}}>
              {writer?.avatar_url?<Image source={{uri:writer.avatar_url}} style={{width:20,height:20,borderRadius:10}}/>:<View style={{width:20,height:20,borderRadius:10,backgroundColor:'#ffffff2E',alignItems:'center',justifyContent:'center'}}><Feather name="user" size={10} color="#EAF4F1"/></View>}
              <T numberOfLines={1} style={dStyles.storyAuthor}>{b.author}</T>
              <Feather name="chevron-right" size={12} color="#EAF4F199"/>
            </Pressable>
            <View style={dStyles.tagRow}>
              <View style={[dStyles.miniTag,{backgroundColor:'#ffffff1F'}]}><Feather name="star" size={10} color={accent}/><T style={dStyles.miniTagT}>{b.rating}</T></View>
              <View style={[dStyles.miniTag,{backgroundColor:'#ffffff1F'}]}><Feather name="book-open" size={10} color="#EAF4F1"/><T style={dStyles.miniTagT}>{b.chapters.length} {tr(p,'chapters')}</T></View>
              {b.isNew?<View style={[dStyles.miniTag,{backgroundColor:'#F59E0B'}]}><T style={dStyles.miniTagT}>{copy(p.state.settings.language,'statusNew')}</T></View>:null}
            </View>
          </View>
        </View>
      </View>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:14,paddingHorizontal:4}}>
        {b.views_visible!==false?<View style={{flexDirection:'row',alignItems:'center',gap:6}}><Feather name="eye" size={15} color={t.muted}/><T style={{fontSize:13,fontWeight:'700',color:t.muted}}>{b.views}</T></View>:<View/>}
        <View style={{flexDirection:'row',alignItems:'center',gap:16}}>
          <Pressable onPress={doLike} hitSlop={8} style={{flexDirection:'row',alignItems:'center',gap:5}}>
            <Animated.View style={{transform:[{scale:likeScale}]}}><Feather name="thumbs-up" size={16} color={liked?'#EF4444':t.muted}/></Animated.View>
            <T style={{fontSize:13,fontWeight:'700',color:liked?'#EF4444':t.muted}}>{likes}</T>
          </Pressable>
          <Pressable onPress={doDislike} hitSlop={8} style={{flexDirection:'row',alignItems:'center',gap:5}}>
            <Feather name="thumbs-down" size={15} color={disliked?'#3B82F6':t.muted}/>
          </Pressable>
          <Pressable onPress={goComments} hitSlop={8} style={{flexDirection:'row',alignItems:'center',gap:5}}>
            <Feather name="message-circle" size={16} color={cmtCount==null?t.muted:t.primary}/>
            <T style={{fontSize:13,fontWeight:'700',color:cmtCount==null?t.muted:t.primary}}>{cmtCount==null?'…':cmtCount}</T>
          </Pressable>
        </View>
      </View>
      {hasStarted?<Pressable onPress={()=>p.read(b.id,continueIdx)} style={[dStyles.readBtn,{backgroundColor:t.primary,marginBottom:10}]}><Feather name="play" size={18} color="#fff"/><T style={dStyles.readBtnTxt}>{tr(p,'continueReading')}</T></Pressable>:
      <Pressable onPress={readAll} style={[dStyles.readBtn,{backgroundColor:t.primary,marginBottom:10}]}><Feather name="book-open" size={18} color="#fff"/><T style={dStyles.readBtnTxt}>{tr(p,'startReading')}</T></Pressable>}
      {isOffline?<Pressable onPress={doDownload} style={[dStyles.dlBtn,{backgroundColor:'#10B981',borderColor:'#10B981'}]}><Feather name="check-circle" size={18} color="#fff"/><T style={{color:'#fff',fontWeight:'900',fontSize:15}}>{tr(p,'readOffline')}</T></Pressable>:
      dlPct!==null?<View style={[dStyles.dlBtn,{backgroundColor:t.card,borderColor:t.line}]}><Svg width={18} height={18} viewBox="0 0 24 24" fill="none"><Path d="M12 3v10m0 0l-4-4m4 4l4-4" stroke={t.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></Svg><T style={{color:t.primary,fontWeight:'900',fontSize:14}}>{tr(p,'downloading')}… {dlPct}%</T></View>:
      <Pressable onPress={doDownload} style={[dStyles.dlBtn,{backgroundColor:t.card,borderColor:t.line}]}><Svg width={18} height={18} viewBox="0 0 24 24" fill="none"><Path d="M12 3v10m0 0l-4-4m4 4l4-4" stroke={t.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/><Path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke={t.primary} strokeWidth={2} strokeLinecap="round"/></Svg><T style={{color:t.primary,fontWeight:'900',fontSize:15}}>{tr(p,'readOffline')}</T></Pressable>}
      <Section title={`${tr(p,'chapters')} (${b.chapters.length})`} theme={t}/>
      {b.chapters.length?b.chapters.map((c,i)=>{const isReading=lastChapter===i;return <Pressable key={c.id} onPress={()=>p.read(b.id,i)} style={[dStyles.chapter,{backgroundColor:isReading?accent+'18':t.card,borderColor:isReading?accent:t.line}]}><View style={[dStyles.numBadge,{backgroundColor:isReading?accent:accent+'1F'}]}><T style={{color:isReading?'#fff':accent,fontWeight:'900',fontSize:13}}>{i+1}</T></View><View style={{flex:1}}><T numberOfLines={1} style={[styles.rowTitle,{color:isReading?accent:t.ink}]}>{c.title}</T></View><Feather name="chevron-right" size={18} color={isReading?accent:t.muted}/></Pressable>}):<Empty theme={t}/>}
      <Section title={tr(p,'summary')} theme={t}/>
      <View style={[dStyles.sumCard,{backgroundColor:t.card,borderColor:t.line}]}>
        <T style={{color:t.ink,lineHeight:23}}>{b.description||'—'}</T>
      </View>
    </Animated.View>
    {showMoreMenu&&<Pressable onPress={()=>setShowMoreMenu(false)} style={{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.3)',zIndex:100}}>
      <View style={{position:'absolute',top:50,right:16,backgroundColor:t.card,borderRadius:14,padding:6,minWidth:180,shadowColor:'#000',shadowOffset:{width:0,height:4},shadowOpacity:0.15,shadowRadius:12,elevation:8,borderWidth:1,borderColor:t.line}}>
        <Pressable onPress={()=>{setShowMoreMenu(false);Share.share({message:`${b.title} - ${b.author}`})}} style={{flexDirection:'row',alignItems:'center',gap:10,paddingVertical:12,paddingHorizontal:14,borderRadius:10}}>
          <Feather name="share-2" size={16} color={t.primary}/><T style={{fontSize:14,fontWeight:'600',color:t.ink}}>{tr(p,'shareBook')}</T>
        </Pressable>
        <View style={{height:1,backgroundColor:t.line,marginHorizontal:8}}/>
        <Pressable onPress={()=>{setShowMoreMenu(false);setShowReport(true)}} style={{flexDirection:'row',alignItems:'center',gap:10,paddingVertical:12,paddingHorizontal:14,borderRadius:10}}>
          <Feather name="flag" size={16} color="#EF4444"/><T style={{fontSize:14,fontWeight:'600',color:'#EF4444'}}>{tr(p,'reportStory')}</T>
        </Pressable>
      </View>
    </Pressable>}
    {showReport&&<Pressable onPress={()=>{setShowReport(false);setReportSent(false);setReportReason('');setReportDetails('')}} style={{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'flex-start',alignItems:'center',paddingHorizontal:24,paddingTop:60,zIndex:101}}>
      <Pressable onPress={()=>{}} style={{width:'100%',maxWidth:400,backgroundColor:t.card,borderRadius:20,padding:24,maxHeight:'85%'}}>
        {reportSent?<View style={{alignItems:'center',paddingVertical:20}}>
          <View style={{width:60,height:60,borderRadius:30,backgroundColor:'#ECFDF5',alignItems:'center',justifyContent:'center',marginBottom:14}}><Feather name="check-circle" size={30} color="#10B981"/></View>
          <T style={{fontSize:16,fontWeight:'800',color:t.ink,textAlign:'center'}}>{tr(p,'reportThanks')}</T>
        </View>:<>
          <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:18}}>
            <T style={{fontSize:17,fontWeight:'900',color:t.ink}}>{tr(p,'reportStory')}</T>
            <Pressable onPress={()=>{setShowReport(false);setReportReason('');setReportDetails('')}}><Feather name="x" size={20} color={t.muted}/></Pressable>
          </View>
          <T style={{fontSize:13,fontWeight:'700',color:t.muted,marginBottom:10}}>{tr(p,'reportReason')}</T>
          {[{k:'abusive',l:tr(p,'reportAbusive'),c:'#EF4444'},{k:'spam',l:tr(p,'reportSpam'),c:'#F59E0B'},{k:'hate',l:tr(p,'reportHate'),c:'#8B5CF6'},{k:'violence',l:tr(p,'reportViolence'),c:'#DC2626'},{k:'inappropriate',l:tr(p,'reportInappropriate'),c:'#F97316'},{k:'other',l:tr(p,'reportOther'),c:'#6B7280'}].map(r=>{const sel=reportReason===r.k;return <Pressable key={r.k} onPress={()=>setReportReason(r.k)} style={{flexDirection:'row',alignItems:'center',gap:10,paddingVertical:11,paddingHorizontal:12,borderRadius:10,marginBottom:6,backgroundColor:sel?r.c+'18':t.bg,borderWidth:1.5,borderColor:sel?r.c:t.line}}>
            <View style={{width:20,height:20,borderRadius:10,borderWidth:2,borderColor:sel?r.c:t.muted,alignItems:'center',justifyContent:'center'}}>{sel?<View style={{width:10,height:10,borderRadius:5,backgroundColor:r.c}}/>:null}</View>
            <T style={{fontSize:14,fontWeight:sel?'800':'600',color:sel?r.c:t.ink,flex:1}}>{r.l}</T>
          </Pressable>})}
          <T style={{fontSize:13,fontWeight:'700',color:t.muted,marginBottom:8,marginTop:4}}>{tr(p,'reportDetails')}</T>
          <TextInput value={reportDetails} onChangeText={setReportDetails} multiline placeholder={tr(p,'reportDetails')} placeholderTextColor={t.muted+'88'} style={{backgroundColor:t.bg,borderWidth:1,borderColor:t.line,borderRadius:12,padding:12,minHeight:70,color:t.ink,fontSize:14,fontWeight:'500',textAlignVertical:'top',marginBottom:16}}/>
          <Pressable disabled={!reportReason||reporting} onPress={doReport} style={{backgroundColor:!reportReason?'#90A4AE':'#EF4444',borderRadius:12,paddingVertical:14,alignItems:'center',opacity:reporting?.6:1}}>
            {reporting?<ActivityIndicator color="#fff" size="small"/>:<T style={{color:'#fff',fontWeight:'800',fontSize:15}}>{tr(p,'reportSubmit')}</T>}
          </Pressable>
        </>}
      </Pressable>
    </Pressable>}
  </Page>}
function Comments(p:C&{bookId:string}){const t=p.theme;const b=p.allBooks.find(x=>x.id===p.bookId)||p.dlBooks[p.bookId];const [items,setItems]=useState<{id:string;display_name:string;body:string;created_at:string;avatar_url:string}[]>([]);const [draft,setDraft]=useState('');const [posting,setPosting]=useState(false);const [loading,setLoading]=useState(true);const[showSuccess,setShowSuccess]=useState(false);const[approvalRequired,setApprovalRequired]=useState(true);const spinAnim=useRef(new Animated.Value(0)).current;const scaleAnim=useRef(new Animated.Value(0)).current;const checkAnim=useRef(new Animated.Value(0)).current;
  const cmtColors=['#E8F5E9','#FFF3E0','#E3F2FD','#F3E5F5','#E0F7FA','#FFF8E1','#FCE4EC','#E8EAF6','#F1F8E9','#FBE9E7'];
  const isWriter=Boolean(p.state.writer);
  const isUser=Boolean(p.state.user);
  const commenterName=isWriter?p.state.writer!.writer_name:isUser?p.state.user!.display_name:p.state.name||'পাঠক';
  const commenterAvatar=isWriter?p.state.writer!.avatar_url||'':isUser?p.state.user!.avatar_url||'':'';
  const load=()=>fetchRemoteComments(p.bookId).then(c=>{if(c&&Array.isArray(c))setItems(c as any)}).finally(()=>setLoading(false));
  useEffect(()=>{load();fetchCommentsConfig().then(r=>setApprovalRequired(r.comments_approval)).catch(()=>{});},[p.bookId]);
  useEffect(()=>{if(showSuccess){spinAnim.setValue(0);scaleAnim.setValue(0);checkAnim.setValue(0);Animated.sequence([Animated.parallel([Animated.timing(spinAnim,{toValue:1,duration:800,easing:Easing.out(Easing.cubic),useNativeDriver:true}),Animated.spring(scaleAnim,{toValue:1,friction:5,useNativeDriver:true})]),Animated.timing(checkAnim,{toValue:1,duration:400,useNativeDriver:true})]).start();const timer=setTimeout(()=>setShowSuccess(false),3000);return()=>clearTimeout(timer)}},[showSuccess]);
  const post=async()=>{const x=draft.trim();if(!x||posting)return;setPosting(true);Vibration.vibrate(30);const res=await submitComment(p.bookId,p.state.deviceId,commenterName,x,commenterAvatar);setPosting(false);if(res.ok){setDraft('');setShowSuccess(true);load()}};
  const insets=useSafeAreaInsets();
  return <KeyboardAvoidingView style={{flex:1,backgroundColor:t.bg}} behavior={Platform.OS==='ios'?'padding':'height'} keyboardVerticalOffset={0}>
    <ScrollView style={{flex:1,backgroundColor:t.bg}} contentContainerStyle={{paddingHorizontal:18,paddingTop:insets.top+12,paddingBottom:130}} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Back title={b?.title||tr(p,'comments')} theme={t} onPress={()=>p.setScreen({type:'book',id:p.bookId})}/>
      <Section title={tr(p,'comments')} theme={t}/>
      <View style={{flexDirection:'row',alignItems:'center',gap:8,marginBottom:12}}><Feather name="message-circle" size={16} color={t.primary}/><T style={{color:t.muted,fontSize:13,fontWeight:'800'}}>{items.length} {tr(p,'comments')}</T><Pressable onPress={load} hitSlop={8}><Feather name="refresh-cw" size={14} color={t.primary}/></Pressable></View>
      <View style={[dStyles.composer,{borderColor:t.line,backgroundColor:t.card,elevation:2,shadowColor:'#000',shadowOpacity:.06,shadowRadius:8,shadowOffset:{width:0,height:3}}]}>
        {commenterAvatar?<Image source={{uri:commenterAvatar}} style={[dStyles.avatar2,{backgroundColor:t.tint}]}/>:<View style={[dStyles.avatar2,{backgroundColor:t.tint}]}><T style={{color:t.primary,fontWeight:'900',fontSize:14}}>{(commenterName||'?')[0]}</T></View>}
        <TextInput value={draft} onChangeText={setDraft} placeholder={tr(p,'writeComment')} placeholderTextColor={t.muted} multiline style={[dStyles.cmtInput,{flex:1,color:t.ink,backgroundColor:t.bg,borderColor:t.line}]}/>
        <Pressable disabled={!draft.trim()||posting} onPress={post} style={[dStyles.postBtn,{backgroundColor:!draft.trim()?'#90A4AE':t.primary,opacity:posting?.6:1,paddingHorizontal:16}]}><T style={{color:'#fff',fontWeight:'900',fontSize:12}}>{posting?'...':tr(p,'postComment')}</T></Pressable>
      </View>
      {showSuccess&&<Animated.View style={{alignItems:'center',marginVertical:16,overflow:'hidden'}}>
        <Animated.View style={{width:70,height:70,borderRadius:35,backgroundColor:'#E8F5E9',alignItems:'center',justifyContent:'center',transform:[{scale:scaleAnim}]}}>
          <Animated.View style={{transform:[{rotate:spinAnim.interpolate({inputRange:[0,1],outputRange:['0deg','360deg']})}]}}>
            <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
              <Circle cx={12} cy={12} r={11} stroke="#4CAF50" strokeWidth={2} strokeDasharray={69} strokeDashoffset={0} strokeLinecap="round"/>
            </Svg>
          </Animated.View>
          <Animated.View style={{position:'absolute',opacity:checkAnim}}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path d="M7 12.5l3 3 7-7" stroke="#4CAF50" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>
            </Svg>
          </Animated.View>
        </Animated.View>
        <Animated.View style={{opacity:checkAnim,marginTop:10,alignItems:'center'}}>
          <T style={{fontSize:14,fontWeight:'800',color:'#4CAF50'}}>{p.state.settings.language==='bn'?'মন্তব্য জমা হয়েছে!':p.state.settings.language==='hi'?'टिप्पणी सबमिट हो गई!':'Comment submitted!'}</T>
          {approvalRequired&&<T style={{fontSize:12,color:t.muted,marginTop:4,textAlign:'center'}}>{p.state.settings.language==='bn'?'আপনার মন্তব্যটি যাচাইয়ের পরে প্রকাশিত হবে':p.state.settings.language==='hi'?'आपकी टिप्पणी समीक्षा के बाद दिखाई देगी':'Your comment will appear after moderation'}</T>}
        </Animated.View>
      </Animated.View>}
      <View style={{marginTop:4}}>
        {loading?<View style={{alignItems:'center',paddingVertical:34}}><ActivityIndicator color={t.primary}/></View>:
        !items.length?<View style={{alignItems:'center',paddingVertical:40}}><Feather name="message-circle" size={30} color={t.muted}/><T style={{color:t.muted,fontSize:13,marginTop:10,textAlign:'center'}}>{tr(p,'noComments')}</T></View>:
        items.map((c,i)=><View key={c.id} style={{width:'100%',flexDirection:'row',gap:10,backgroundColor:cmtColors[i%cmtColors.length],borderRadius:14,padding:12,marginBottom:8}}>
          {c.avatar_url?<Image source={{uri:c.avatar_url}} style={{width:36,height:36,borderRadius:18,flexShrink:0}}/>:<View style={{width:36,height:36,borderRadius:18,backgroundColor:t.primary,alignItems:'center',justifyContent:'center',flexShrink:0}}><T style={{color:'#fff',fontWeight:'900',fontSize:14}}>{(c.display_name||'?')[0]?.toUpperCase()}</T></View>}
          <View style={{flex:1}}>
            <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><T style={{fontSize:13,fontWeight:'800',color:t.ink}}>{c.display_name}</T><T style={{color:t.muted,fontSize:10}}>{new Date(c.created_at).toLocaleDateString()}</T></View>
            <T style={{color:t.ink,fontSize:13,lineHeight:19,marginTop:3}}>{c.body}</T>
          </View>
        </View>)}
      </View>
    </ScrollView>
  </KeyboardAvoidingView>
}
function Reader(p:C&{book:Book;chapter:number}){const insets=useSafeAreaInsets();const {width}=useWindowDimensions();const c=p.book.chapters[p.chapter];if(!c)return <View style={{flex:1,backgroundColor:p.theme.reader,alignItems:'center',justifyContent:'center',padding:30}}><Feather name="book-open" size={40} color={p.theme.muted}/><T style={{color:p.theme.ink,fontWeight:'800',fontSize:16,textAlign:'center',marginTop:14}}>এই বইয়ে এখনো কোনো অধ্যায় নেই।</T><Button title="ফিরে যান" icon="arrow-left" onPress={()=>p.setScreen({type:'book',id:p.book.id})}/></View>;const key=c.id,progress=p.state.positions[key]||0;
const [showSettings,setShowSettings]=useState(false);
const [showChapters,setShowChapters]=useState(false);
const [readSeconds,setReadSeconds]=useState(0);
const autoScrollRef=useRef<ReturnType<typeof setInterval>|null>(null);
const scrollRef=useRef<ScrollView>(null);
const autoOffsetRef=useRef(0);
const s=p.state.settings;
useEffect(()=>{const timer=setInterval(()=>{setReadSeconds(prev=>prev+1)},60000);return()=>clearInterval(timer)},[]);
useEffect(()=>{const today=new Date().toISOString().slice(0,10);const prev=p.state.readingActivity[today]||{minutes:0,episodes:0};p.update({readingActivity:{...p.state.readingActivity,[today]:{minutes:prev.minutes+(c.minutes||5),episodes:prev.episodes+1}}})},[c.id]);
useEffect(()=>{p.update({positions:{...p.state.positions,[p.book.id+'_lastChapter']:p.chapter}});},[p.chapter]);
useEffect(()=>{trackEvent(p.state.deviceId,p.book.id,'view').catch(()=>{});},[p.book.id]);
const change=(patch:Partial<LocalState['settings']>)=>p.update({settings:{...p.state.settings,...patch}});
useEffect(()=>{if(autoScrollRef.current){clearInterval(autoScrollRef.current);autoScrollRef.current=null}if(s.autoScroll){const ms=Math.max(30,120-s.autoScrollSpeed*20);autoScrollRef.current=setInterval(()=>{autoOffsetRef.current+=2;scrollRef.current?.scrollTo({y:autoOffsetRef.current,animated:true})},ms)}return()=>{if(autoScrollRef.current){clearInterval(autoScrollRef.current);autoScrollRef.current=null}}},[s.autoScroll,s.autoScrollSpeed]);
const readerBg=s.readerTheme==='sepia'?'#F4ECD8':s.readerTheme==='dark'?'#1A1A1A':s.readerTheme==='amoled'?'#000000':p.theme.reader;
const readerInk=s.readerTheme==='sepia'?'#5C4B37':s.readerTheme==='dark'?'#D4D4D4':s.readerTheme==='amoled'?'#E0E0E0':p.theme.ink;
const readerMuted=s.readerTheme==='sepia'?'#8C7E6A':s.readerTheme==='dark'?'#888':s.readerTheme==='amoled'?'#999':p.theme.muted;
const readerPrimary=s.readerTheme==='sepia'?'#8B6914':s.readerTheme==='dark'?'#7B96FF':s.readerTheme==='amoled'?'#7B96FF':p.theme.primary;
const readerLineBg=s.readerTheme==='dark'?'#333':s.readerTheme==='amoled'?'#222':p.theme.line;
const readerCardBg=s.readerTheme==='dark'?'#222':s.readerTheme==='amoled'?'#111':p.theme.card;
const readerSize=Math.max(16,Math.min(25,s.fontSize));
const readerLine=Math.round(Math.max(readerSize+6,Math.min(48,s.lineHeight))*s.lineSpacing);
const readerFont=s.fontFamily==='serif'?'serif':(s.fontFamily==='loose'?'sans-serif':GF());
const sidePadding=Math.max(18,Math.min(30,Math.round(width*.07)));
const formatTime=(mins:number)=>{if(mins<60)return `${mins} ${tr(p,'minutesShort')}`;const h=Math.floor(mins/60);const m=mins%60;return m>0?`${h}h ${m}m`:`${h}h`};
const CustomSlider=({value,min,max,step,onValueChange}:{value:number;min:number;max:number;step:number;onValueChange:(v:number)=>void})=>{const pct=(value-min)/(max-min);const steps=Math.round((max-min)/step);return <View style={{flexDirection:'row',alignItems:'center',gap:8}}><Pressable onPress={()=>{const nv=Math.max(min,value-step);onValueChange(Math.round(nv*10)/10)}} style={{width:32,height:32,borderRadius:16,backgroundColor:readerCardBg,borderWidth:1,borderColor:readerLineBg,alignItems:'center',justifyContent:'center'}}><Feather name="minus" size={16} color={readerPrimary}/></Pressable><View style={{flex:1,height:32,justifyContent:'center'}}><View style={{height:4,borderRadius:2,backgroundColor:readerLineBg,overflow:'hidden'}}><View style={{height:4,borderRadius:2,backgroundColor:readerPrimary,width:`${pct*100}%`}}/></View>{Array.from({length:steps+1}).map((_,i)=>{const x=i/steps;return <View key={i} style={{position:'absolute',left:`${x*100}%`,width:6,height:6,borderRadius:3,backgroundColor:Math.abs(pct-x)<0.01?readerPrimary:readerLineBg,top:13,marginLeft:-3}}/>})}</View><Pressable onPress={()=>{const nv=Math.min(max,value+step);onValueChange(Math.round(nv*10)/10)}} style={{width:32,height:32,borderRadius:16,backgroundColor:readerCardBg,borderWidth:1,borderColor:readerLineBg,alignItems:'center',justifyContent:'center'}}><Feather name="plus" size={16} color={readerPrimary}/></Pressable></View>};
const Toggle=({value,onValueChange}:{value:boolean;onValueChange:(v:boolean)=>void})=><Pressable onPress={()=>onValueChange(!value)} style={{width:50,height:28,borderRadius:14,backgroundColor:value?readerPrimary:readerLineBg,justifyContent:'center',paddingHorizontal:2}}><View style={{width:24,height:24,borderRadius:12,backgroundColor:'#fff',alignSelf:value?'flex-end':'flex-start',shadowColor:'#000',shadowOpacity:0.15,shadowRadius:3,shadowOffset:{width:0,height:1},elevation:2}}/></Pressable>;
const totalProgress=Math.round(((p.chapter*100+progress)/Math.max(1,p.book.chapters.length*100))*100);
return <View style={{flex:1,backgroundColor:readerBg}}>
{s.eyeComfort>0&&<View style={{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:`rgba(255,180,50,${s.eyeComfort/500})`,zIndex:50,pointerEvents:'none'}}/>}
{s.brightness<100&&<View style={{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:`rgba(0,0,0,${(100-s.brightness)/200})`,zIndex:51,pointerEvents:'none'}}/>}
<View style={[styles.readerHead,{borderBottomColor:readerLineBg,paddingTop:insets.top+8,paddingBottom:10,backgroundColor:readerBg}]}>
<Pressable hitSlop={10} onPress={()=>p.setScreen({type:'book',id:p.book.id})}><Feather name="arrow-left" size={22} color={readerInk}/></Pressable>
<View style={{flex:1,marginLeft:16}}>
<T allowFontScaling={false} numberOfLines={1} style={{color:readerInk,fontWeight:'900'}}>{c.title}</T>
<T allowFontScaling={false} numberOfLines={1} style={{color:readerMuted,fontSize:10}}>{p.book.title}{readSeconds>0?` · ${tr(p,'readingTime')} ${formatTime(readSeconds)}`:''}</T>
</View>
<Pressable hitSlop={10} onPress={()=>p.update({bookmarks:p.state.bookmarks.includes(key)?p.state.bookmarks.filter(x=>x!==key):[...p.state.bookmarks,key]})}><Feather name="bookmark" size={21} color={p.state.bookmarks.includes(key)?readerPrimary:readerInk}/></Pressable>
<Pressable hitSlop={10} onPress={()=>setShowSettings(true)}><Feather name="more-vertical" size={21} color={readerInk}/></Pressable>
</View>
<View style={{height:2,backgroundColor:readerLineBg}}><View style={{height:2,backgroundColor:readerPrimary,width:`${totalProgress}%`}}/></View>
<ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} onScroll={e=>{const n=e.nativeEvent;const v=Math.round(n.contentOffset.y/Math.max(1,n.contentSize.height-n.layoutMeasurement.height)*100);if(Math.abs(v-progress)>15)p.update({positions:{...p.state.positions,[key]:v}});autoOffsetRef.current=n.contentOffset.y}} scrollEventThrottle={800} contentContainerStyle={[styles.readerBody,{paddingHorizontal:sidePadding,paddingBottom:insets.bottom+110}]}><T allowFontScaling={false} style={{color:readerPrimary,textAlign:'center',fontWeight:'900'}}>অধ্যায় {p.chapter+1}</T><T allowFontScaling={false} style={[styles.readerTitle,{color:readerInk,fontSize:Math.min(30,Math.max(25,width*.075))}]}>{c.title}</T><T allowFontScaling={false} style={{color:readerInk,fontSize:readerSize,lineHeight:readerLine,fontFamily:readerFont,maxWidth:680,alignSelf:'center'}}>{c.body}</T><T allowFontScaling={false} style={{textAlign:'center',color:readerPrimary,fontSize:25,marginTop:30}}>❦</T></ScrollView>
<View style={[styles.readerTools,{backgroundColor:readerCardBg,borderTopColor:readerLineBg,paddingBottom:Math.max(8,insets.bottom),paddingTop:10}]}><Pressable hitSlop={8} disabled={p.chapter===0} onPress={()=>p.read(p.book.id,p.chapter-1)}><T allowFontScaling={false} style={{color:readerInk,fontSize:12,fontWeight:'700',opacity:p.chapter===0?.3:1}}>← আগের</T></Pressable><Pressable hitSlop={8} onPress={()=>change({fontSize:Math.max(15,s.fontSize-1)})}><T allowFontScaling={false} style={{color:readerPrimary,fontWeight:'900'}}>A−</T></Pressable><Pressable hitSlop={8} onPress={()=>change({fontSize:Math.min(28,s.fontSize+1)})}><T allowFontScaling={false} style={{color:readerPrimary,fontWeight:'900'}}>A+</T></Pressable><Pressable hitSlop={8} onPress={()=>change({dark:!s.dark})}><Feather name="moon" size={19} color={readerPrimary}/></Pressable><Pressable hitSlop={8} disabled={p.chapter===p.book.chapters.length-1} onPress={()=>p.read(p.book.id,p.chapter+1)}><T allowFontScaling={false} style={{color:readerInk,fontSize:12,fontWeight:'700',opacity:p.chapter===p.book.chapters.length-1?.3:1}}>পরের →</T></Pressable></View>
{showSettings&&<Pressable onPress={()=>setShowSettings(false)} style={{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.4)',zIndex:100}}><Pressable onPress={()=>{}} style={{position:'absolute',bottom:0,left:0,right:0,backgroundColor:readerCardBg,borderTopLeftRadius:24,borderTopRightRadius:24,paddingHorizontal:20,paddingTop:16,paddingBottom:Math.max(20,insets.bottom),maxHeight:'80%'}}><View style={{width:40,height:4,borderRadius:2,backgroundColor:readerLineBg,alignSelf:'center',marginBottom:14}}/><T style={{fontSize:17,fontWeight:'900',color:readerInk,marginBottom:16}}>{tr(p,'readerSettings')}</T>
<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom:20}}>
<Pressable onPress={()=>{setShowSettings(false);setShowChapters(true)}} style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingVertical:14,borderBottomWidth:1,borderBottomColor:readerLineBg+'44'}}><View style={{flexDirection:'row',alignItems:'center',gap:10}}><Feather name="list" size={18} color={readerPrimary}/><T style={{fontSize:14,fontWeight:'700',color:readerInk}}>{tr(p,'chapterList')}</T></View><View style={{flexDirection:'row',alignItems:'center',gap:6}}><T style={{fontSize:12,fontWeight:'600',color:readerMuted}}>{p.chapter+1}/{p.book.chapters.length}</T><Feather name="chevron-right" size={16} color={readerMuted}/></View></Pressable>
<T style={{fontSize:13,fontWeight:'700',color:readerMuted,marginBottom:8,marginTop:14}}>{tr(p,'readerTheme')}</T><View style={{flexDirection:'row',gap:8,marginBottom:16}}>{[{k:'default',l:tr(p,'light'),bg:'#FFFFFF',ink:'#1A1A1A'},{k:'sepia',l:tr(p,'sepia'),bg:'#F4ECD8',ink:'#5C4B37'},{k:'dark',l:tr(p,'darkReader'),bg:'#1A1A1A',ink:'#D4D4D4'},{k:'amoled',l:tr(p,'amoled'),bg:'#000000',ink:'#E0E0E0'}].map(t=><Pressable key={t.k} onPress={()=>change({readerTheme:t.k as any})} style={{flex:1,alignItems:'center',paddingVertical:10,borderRadius:12,backgroundColor:t.bg,borderWidth:2,borderColor:s.readerTheme===t.k?readerPrimary:'transparent'}}><View style={{width:28,height:28,borderRadius:8,backgroundColor:t.bg,borderWidth:1,borderColor:t.ink+'33',marginBottom:4,alignItems:'center',justifyContent:'center'}}><Feather name="book-open" size={14} color={t.ink}/></View><T style={{fontSize:10,fontWeight:'700',color:t.ink}}>{t.l}</T></Pressable>)}</View>
<T style={{fontSize:13,fontWeight:'700',color:readerMuted,marginBottom:8}}>{tr(p,'readerFont')}</T><View style={{flexDirection:'row',gap:8,marginBottom:16}}>{[{k:'default',l:tr(p,'fontDefault')},{k:'serif',l:tr(p,'fontSerif')},{k:'loose',l:tr(p,'fontLoose')}].map(f=><Pressable key={f.k} onPress={()=>change({fontFamily:f.k as any})} style={{flex:1,alignItems:'center',paddingVertical:10,borderRadius:12,backgroundColor:s.fontFamily===f.k?readerPrimary+'18':'transparent',borderWidth:1.5,borderColor:s.fontFamily===f.k?readerPrimary:readerLineBg}}><T style={{fontSize:13,fontWeight:s.fontFamily===f.k?'800':'600',color:s.fontFamily===f.k?readerPrimary:readerInk}}>{f.l}</T></Pressable>)}</View>
<View style={{marginBottom:14}}><View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:8}}><T style={{fontSize:13,fontWeight:'700',color:readerMuted}}>{tr(p,'lineSpacing')}</T><T style={{fontSize:12,fontWeight:'700',color:readerPrimary}}>{s.lineSpacing.toFixed(1)}x</T></View><View style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:20}}><Pressable onPress={()=>change({lineSpacing:Math.max(0.8,+(s.lineSpacing-0.1).toFixed(1))})} style={{width:40,height:40,borderRadius:12,backgroundColor:readerLineBg,alignItems:'center',justifyContent:'center'}}><T style={{fontSize:20,fontWeight:'900',color:readerPrimary}}>-</T></Pressable><T style={{fontSize:16,fontWeight:'800',color:readerInk,minWidth:50,textAlign:'center'}}>{s.lineSpacing.toFixed(1)}x</T><Pressable onPress={()=>change({lineSpacing:Math.min(2.0,+(s.lineSpacing+0.1).toFixed(1))})} style={{width:40,height:40,borderRadius:12,backgroundColor:readerLineBg,alignItems:'center',justifyContent:'center'}}><T style={{fontSize:20,fontWeight:'900',color:readerPrimary}}>+</T></Pressable></View></View>
<View style={{marginBottom:14}}><View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:4}}><T style={{fontSize:13,fontWeight:'700',color:readerMuted}}>{tr(p,'brightness')}</T><T style={{fontSize:12,fontWeight:'700',color:readerPrimary}}>{s.brightness}%</T></View><CustomSlider value={s.brightness} min={20} max={100} step={5} onValueChange={(v:number)=>change({brightness:v})}/></View>
<View style={{marginBottom:14}}><View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:4}}><View style={{flexDirection:'row',alignItems:'center',gap:8}}><Feather name="eye" size={16} color={readerMuted}/><T style={{fontSize:13,fontWeight:'700',color:readerMuted}}>{tr(p,'eyeComfort')}</T></View><T style={{fontSize:12,fontWeight:'700',color:readerPrimary}}>{s.eyeComfort>0?s.eyeComfort+'%':'OFF'}</T></View><CustomSlider value={s.eyeComfort} min={0} max={80} step={5} onValueChange={(v:number)=>change({eyeComfort:v})}/></View>
<View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingVertical:12,borderTopWidth:1,borderTopColor:readerLineBg+'44'}}><View style={{flexDirection:'row',alignItems:'center',gap:10}}><Feather name="smartphone" size={18} color={readerMuted}/><T style={{fontSize:14,fontWeight:'600',color:readerInk}}>{tr(p,'keepScreenOn')}</T></View><Toggle value={Boolean(s.keepScreenOn)} onValueChange={(v:boolean)=>change({keepScreenOn:v})}/></View>
<View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingVertical:12,borderTopWidth:1,borderTopColor:readerLineBg+'44'}}><View style={{flexDirection:'row',alignItems:'center',gap:10}}><Feather name="volume-2" size={18} color={readerMuted}/><T style={{fontSize:14,fontWeight:'600',color:readerInk}}>{tr(p,'volumeScroll')}</T></View><Toggle value={Boolean(s.volumeScroll)} onValueChange={(v:boolean)=>change({volumeScroll:v})}/></View>
<View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingVertical:12,borderTopWidth:1,borderTopColor:readerLineBg+'44'}}><View style={{flexDirection:'row',alignItems:'center',gap:10}}><Feather name="play-circle" size={18} color={readerMuted}/><T style={{fontSize:14,fontWeight:'600',color:readerInk}}>{tr(p,'autoScroll')}</T></View><View style={{flexDirection:'row',alignItems:'center',gap:8}}><Toggle value={s.autoScroll} onValueChange={(v:boolean)=>change({autoScroll:v})}/></View></View>
{s.autoScroll&&<View style={{paddingTop:8,paddingBottom:12}}><View style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:20}}><Pressable onPress={()=>change({autoScrollSpeed:Math.max(1,s.autoScrollSpeed-1)})} style={{width:40,height:40,borderRadius:12,backgroundColor:readerLineBg,alignItems:'center',justifyContent:'center'}}><T style={{fontSize:20,fontWeight:'900',color:readerPrimary}}>-</T></Pressable><View style={{alignItems:'center'}}><T style={{fontSize:11,color:readerMuted}}>Speed</T><T style={{fontSize:16,fontWeight:'800',color:readerInk,minWidth:50,textAlign:'center'}}>{s.autoScrollSpeed}/5</T></View><Pressable onPress={()=>change({autoScrollSpeed:Math.min(5,s.autoScrollSpeed+1)})} style={{width:40,height:40,borderRadius:12,backgroundColor:readerLineBg,alignItems:'center',justifyContent:'center'}}><T style={{fontSize:20,fontWeight:'900',color:readerPrimary}}>+</T></Pressable></View></View>}
</ScrollView>
</Pressable></Pressable>}
{showChapters&&<Pressable onPress={()=>setShowChapters(false)} style={{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.4)',zIndex:100}}><Pressable onPress={()=>{}} style={{position:'absolute',bottom:0,left:0,right:0,backgroundColor:readerCardBg,borderTopLeftRadius:24,borderTopRightRadius:24,paddingHorizontal:20,paddingTop:16,paddingBottom:Math.max(20,insets.bottom),maxHeight:'80%'}}><View style={{width:40,height:4,borderRadius:2,backgroundColor:readerLineBg,alignSelf:'center',marginBottom:14}}/>
<View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:14}}><T style={{fontSize:17,fontWeight:'900',color:readerInk}}>{tr(p,'chapterList')}</T><T style={{fontSize:12,fontWeight:'700',color:readerMuted}}>{p.book.chapters.length} {tr(p,'chapterList')}</T></View>
<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom:10}}>{p.book.chapters.map((ch,i)=>{
const isCurrent=i===p.chapter;
const pos=p.state.positions[ch.id];
return <Pressable key={ch.id} onPress={()=>{setShowChapters(false);p.read(p.book.id,i)}} style={{flexDirection:'row',alignItems:'center',gap:12,paddingVertical:12,paddingHorizontal:12,borderRadius:12,backgroundColor:isCurrent?readerPrimary+'18':'transparent'}}>
<View style={{width:36,height:36,borderRadius:10,backgroundColor:isCurrent?readerPrimary:readerLineBg,alignItems:'center',justifyContent:'center'}}><T style={{fontSize:13,fontWeight:'900',color:isCurrent?'#fff':readerInk}}>{i+1}</T></View>
<View style={{flex:1}}><T numberOfLines={1} style={{fontSize:14,fontWeight:isCurrent?'800':'600',color:isCurrent?readerPrimary:readerInk}}>{ch.title}</T><T style={{fontSize:11,color:readerMuted}}>{ch.minutes||5} {tr(p,'minutesShort')}{pos?` · ${pos}%`:''}</T></View>
{isCurrent&&<Feather name="book-open" size={16} color={readerPrimary}/>}
</Pressable>})}</ScrollView>
</Pressable></Pressable>}
</View>}
function AnimatedToggle({value,onChange,color,track}:{value:boolean;onChange:(v:boolean)=>void;color:string;track:string}){
  const anim=useRef(new Animated.Value(value?1:0)).current;
  useEffect(()=>{Animated.timing(anim,{toValue:value?1:0,duration:230,useNativeDriver:true}).start();},[value,anim]);
  const thumbX=anim.interpolate({inputRange:[0,1],outputRange:[2,26]});
  const bg=anim.interpolate({inputRange:[0,1],outputRange:[track,color]});
  return <Pressable onPress={()=>onChange(!value)} style={{width:54,height:30,borderRadius:15,justifyContent:'center'}}>
    <Animated.View style={{...StyleSheet.absoluteFillObject,borderRadius:15,backgroundColor:bg}}/>
    <Animated.View style={{position:'absolute',top:3,width:24,height:24,borderRadius:12,backgroundColor:'#fff',transform:[{translateX:thumbX}],alignItems:'center',justifyContent:'center',shadowColor:'#000',shadowOffset:{width:0,height:2},shadowOpacity:0.25,shadowRadius:3,elevation:4}}>
      <Feather name={value?'moon':'sun'} size={13} color={value?'#FCD34D':'#B45309'}/>
    </Animated.View>
  </Pressable>;
}
function Settings(p:C){
  const set=(x:Partial<LocalState['settings']>)=>p.update({settings:{...p.state.settings,...x}});
  const language=p.state.settings.language;
  const t=p.theme;
  const currentThemeId=p.state.settings.themeId||'katagolap';
  const darkMode=p.state.settings.dark;

  const themes:{id:ThemeId;nameBn:string;nameEn:string;colors:string[]}[]=[
    {id:'katagolap',nameBn:'কাঠগোলাপ',nameEn:'Rosewood',colors:['#087A63','#172421']},
    {id:'sepia',nameBn:'সেপিয়া',nameEn:'Sepia',colors:['#8B6914','#2C2416']},
    {id:'midnight',nameBn:'মধ্যরাত',nameEn:'Midnight',colors:['#4A6CF7','#1A1F36']},
    {id:'godhuli',nameBn:'গোধূলি',nameEn:'Dusk',colors:['#C05621','#2D1B0E']},
    {id:'sagar',nameBn:'সাগর',nameEn:'Ocean',colors:['#1A7FA0','#0F2B33']},
    {id:'oronno',nameBn:'অরণ্য',nameEn:'Forest',colors:['#2D7A3A','#1A2E1E']},
    {id:'lavender',nameBn:'ল্যাভেন্ডার',nameEn:'Lavender',colors:['#7C3AED','#1E1533']},
    {id:'golapi',nameBn:'গোলাপি',nameEn:'Pink',colors:['#D94A7A','#2E1520']},
    {id:'shapla',nameBn:'শাপলা',nameEn:'Water Lily',colors:['#0E9AA7','#0E2A2E']},
    {id:'golap',nameBn:'গোলাপ',nameEn:'Rose',colors:['#E63946','#3A1520']},
  ];

  const Section=({title,children}:{title:string;children:React.ReactNode})=><><T style={[styles.group,{color:t.muted,marginTop:16,marginBottom:8,fontSize:13,fontWeight:'700'}]}>{title}</T><View style={[styles.menuGroup,{borderRadius:16,borderWidth:1,borderColor:t.line,backgroundColor:t.card,overflow:'hidden'}]}>{children}</View></>;
  const Row=({icon,iconBg,iconColor,children,onPress}:{icon:string;iconBg:string;iconColor:string;children:React.ReactNode;onPress?:()=>void})=><Pressable onPress={onPress} disabled={!onPress} style={[styles.menuItem,{backgroundColor:t.card,opacity:onPress?1:0.9}]}><View style={[styles.menuIconBig,{backgroundColor:iconBg}]}><Feather name={icon as any} size={18} color={iconColor}/></View>{children}</Pressable>;
  const Sep=()=><View style={{height:1,backgroundColor:t.line,marginLeft:62}}/>;

  return <Page theme={t}>
    <Back title={tr(p,'settings')} theme={t} onPress={()=>p.setScreen({type:'main'})}/>

    {/* Themes */}
    <T style={[styles.group,{color:t.muted,marginTop:4,marginBottom:8,fontSize:13,fontWeight:'700'}]}>{copy(language,'settingsThemes')}</T>
    <View style={{borderRadius:16,borderWidth:1,borderColor:t.line,backgroundColor:t.card,padding:10}}>
      <View style={{flexDirection:'row',flexWrap:'wrap',gap:6}}>
        {themes.map(th=>{
          const selected=currentThemeId===th.id;
          const selTheme=themeFor(th.id,false);
          const flowerKinds=new Set(['shapla','golap']);
          const isFlower=flowerKinds.has(th.id);
          return <Pressable key={th.id} onPress={()=>set({themeId:th.id})}
            style={{width:'18.5%',borderRadius:12,overflow:'hidden',borderWidth:2,borderColor:selected?t.primary:selTheme.line,backgroundColor:selTheme.card}}>
            <View style={{backgroundColor:selTheme.bg,alignItems:'center',justifyContent:'center',paddingVertical:10,opacity:0.95}}>
              <FlowerArt kind={isFlower?th.id:'dot'} s={34} primary={selTheme.primary} tint={selTheme.tint} bg={selTheme.bg}/>
            </View>
            <View style={{alignItems:'center',paddingVertical:4}}>
              <T style={{fontSize:8,fontWeight:'800',color:selTheme.ink}} numberOfLines={1}>{th.nameEn}</T>
            </View>
            {selected&&<View style={{position:'absolute',top:3,right:3,width:14,height:14,borderRadius:7,backgroundColor:t.primary,alignItems:'center',justifyContent:'center'}}><Feather name="check" size={8} color="#fff"/></View>}
          </Pressable>})}
      </View>
    </View>

    {/* Appearance */}
    <Section title={copy(language,'settingsAppearance')}>
      <Row icon="sun" iconBg={darkMode?'#1E293B':t.tint} iconColor={darkMode?'#FCD34D':t.primary}>
        <View style={{flex:1}}>
          <T style={[styles.rowTitle,{color:t.ink}]}>{darkMode?tr(p,'darkMode'):tr(p,'lightMode')}</T>
          <T style={{fontSize:11,color:t.muted,marginTop:1}}>{darkMode?tr(p,'darkModeSub'):tr(p,'lightModeSub')}</T>
        </View>
        <AnimatedToggle value={darkMode} onChange={(v)=>set({dark:v})} color={t.primary} track={t.line}/>
      </Row>
      <Sep/>
      <Row icon="type" iconBg={t.tint} iconColor={t.primary}>
        <T style={[styles.rowTitle,{color:t.ink,flex:1}]}>{tr(p,'readerSize')}</T>
        <View style={{alignItems:'center'}}>
          <View style={{flexDirection:'row',alignItems:'center',gap:10}}>
            <Pressable onPress={()=>{const f=Math.max(16,p.state.settings.fontSize-2);set({fontSize:f,lineHeight:f+13});}} style={{width:34,height:34,borderRadius:11,backgroundColor:p.state.settings.fontSize<=16?t.bg:t.tint,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:t.line}}>
              <Feather name="minus" size={17} color={p.state.settings.fontSize<=16?t.muted:t.primary}/>
            </Pressable>
            <View style={{width:52,height:52,borderRadius:16,borderWidth:2,borderColor:t.line,backgroundColor:t.bg,alignItems:'center',justifyContent:'center'}}>
              <T style={{fontSize:Math.max(12,p.state.settings.fontSize-2),fontWeight:'900',color:t.ink,lineHeight:Math.max(12,p.state.settings.fontSize-2)+6}}>Aa</T>
            </View>
            <Pressable onPress={()=>{const f=Math.min(28,p.state.settings.fontSize+2);set({fontSize:f,lineHeight:f+13});}} style={{width:34,height:34,borderRadius:11,backgroundColor:p.state.settings.fontSize>=28?t.bg:t.tint,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:t.line}}>
              <Feather name="plus" size={17} color={p.state.settings.fontSize>=28?t.muted:t.primary}/>
            </Pressable>
          </View>
          <T style={{color:t.muted,fontSize:10,marginTop:4}}>{p.state.settings.fontSize}px</T>
        </View>
      </Row>
    </Section>

    {/* Reading */}
    <Section title={copy(language,'settingsReading')}>
      <Row icon="align-justify" iconBg={t.tint} iconColor={t.primary}>
        <View style={{flex:1}}>
          <T style={[styles.rowTitle,{color:t.ink}]}>{copy(language,'settingsLineSpacing')}</T>
          <T style={{fontSize:11,color:t.muted,marginTop:1}}>{copy(language,'lineSpacingDesc')}</T>
        </View>
        <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
          <Pressable onPress={()=>set({lineSpacing:Math.round((Math.max(0.8,p.state.settings.lineSpacing-0.1))*10)/10})} style={{width:30,height:30,borderRadius:9,backgroundColor:p.state.settings.lineSpacing<=0.8?t.bg:t.tint,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:t.line}}><Feather name="minus" size={15} color={p.state.settings.lineSpacing<=0.8?t.muted:t.primary}/></Pressable>
          <T style={{color:t.ink,fontWeight:'800',fontSize:13,width:30,textAlign:'center'}}>{p.state.settings.lineSpacing.toFixed(1)}</T>
          <Pressable onPress={()=>set({lineSpacing:Math.round((Math.min(1.8,p.state.settings.lineSpacing+0.1))*10)/10})} style={{width:30,height:30,borderRadius:9,backgroundColor:p.state.settings.lineSpacing>=1.8?t.bg:t.tint,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:t.line}}><Feather name="plus" size={15} color={p.state.settings.lineSpacing>=1.8?t.muted:t.primary}/></Pressable>
        </View>
      </Row>
      <Sep/>
      <Row icon="align-left" iconBg={t.tint} iconColor={t.primary}>
        <T style={[styles.rowTitle,{color:t.ink,flex:1}]}>{copy(language,'settingsFont')}</T>
        <View style={{flexDirection:'row',gap:6}}>
          {([['default',copy(language,'fontDefault')],['serif',copy(language,'fontSerif')],['loose',copy(language,'fontLoose')]] as const).map(([k,l])=>{
            const act=p.state.settings.fontFamily===k;
            return <Pressable key={k} onPress={()=>set({fontFamily:k})} style={{paddingVertical:6,paddingHorizontal:10,borderRadius:9,backgroundColor:act?t.primary:t.bg,borderWidth:1,borderColor:act?t.primary:t.line}}><T style={{fontWeight:'800',fontSize:11,color:act?'#fff':t.muted}}>{l}</T></Pressable>;
          })}
        </View>
      </Row>
    </Section>

    {/* Language */}
    <Section title={copy(language,'settingsLanguage')}>
      {([['en','english'],['bn','bangla'],['hi','hindi']] as const).map(([code,key],i)=>(
        <Pressable key={code} onPress={()=>{set({language:code})}} style={[styles.languageRow,{backgroundColor:t.card,paddingHorizontal:14,paddingVertical:12,borderBottomWidth:i===2?0:1,borderBottomColor:t.line}]}>
          <View style={[styles.radio,{borderColor:language===code?t.primary:t.muted}]}>{language===code&&<View style={[styles.radioDot,{backgroundColor:t.primary}]}/>}</View>
          <View style={{flex:1}}>
            <T style={{color:t.ink,fontWeight:language===code?'900':'600',fontSize:14}}>{copy(code,key)}</T>
            <T style={{color:t.muted,fontSize:10}}>{code==='en'?'English':code==='bn'?'বাংলा':'हिन्दी'}</T>
          </View>
          {language===code&&<Feather name="check" size={16} color={t.primary}/>}
        </Pressable>))}
    </Section>

    {/* Data & Sync */}
    <Section title={copy(language,'settingsData')}>
      <Row icon={p.state.online?'refresh-cw':'cloud-off'} iconBg={p.state.online?t.tint:'#FEEBC8'} iconColor={p.state.online?t.primary:'#B45309'} onPress={()=>{p.syncRemote?.();trackEvent(p.state.deviceId,'all','view');}}>
        <View style={{flex:1}}>
          <T style={[styles.rowTitle,{color:t.ink}]}>{copy(language,'settingsSyncNow')}</T>
          <T style={{fontSize:11,color:t.muted,marginTop:1}}>{p.state.online?(language==='bn'?'সব ঠিক আছে':language==='hi'?'सब ठीक है':'All good'):(language==='bn'?'অফলাইন':language==='hi'?'ऑफ़लाइन':'Offline')}</T>
        </View>
        <View style={{backgroundColor:t.tint,borderRadius:10,paddingVertical:8,paddingHorizontal:12}}>
          <T style={{color:t.primary,fontWeight:'900',fontSize:12}}>{p.state.online?copy(language,'settingsSynced'):copy(language,'settingsOffline')}</T>
        </View>
      </Row>
      <Sep/>
      <Row icon="trash-2" iconBg="#FEEBC8" iconColor="#B45309" onPress={()=>p.update({searchHistory:[]})}>
        <T style={[styles.rowTitle,{color:t.ink,flex:1}]}>{copy(language,'settingsClearSearch')}</T>
        <View style={{backgroundColor:t.bg,borderWidth:1,borderColor:t.line,borderRadius:10,paddingVertical:7,paddingHorizontal:12}}>
          <T style={{color:t.primary,fontWeight:'800',fontSize:12}}>{language==='bn'?'মুছুন':language==='hi'?'साफ़ करें':'Clear'}</T>
        </View>
      </Row>
    </Section>

    {/* Downloads */}
    <Section title={language==='bn'?'ডাউনলোড':language==='hi'?'डाउनलोड':'Downloads'}>
      <Row icon="download-cloud" iconBg={t.tint} iconColor={t.primary}>
        <View style={{flex:1}}>
          <T style={[styles.rowTitle,{color:t.ink}]}>{p.state.downloads.length} {language==='bn'?'টি ডাউনলোড':language==='hi'?'डाउनलोड':'downloaded'}</T>
          <T style={{fontSize:11,color:t.muted,marginTop:1}}>{language==='bn'?'অফলাইনে পড়ার জন্য সংরক্ষিত':language==='hi'?'ऑफ़लाइन पढ़ने के लिए सहेजा गया':'Saved for offline reading'}</T>
        </View>
      </Row>
      <Sep/>
      <Row icon="trash-2" iconBg="#FEEBC8" iconColor="#B45309" onPress={()=>Alert.alert(copy(language,'settingsClearAll'),language==='bn'?'সব ডাউনলোড মুছে ফেলা হবে। নিশ্চিত?':language==='hi'?'सभी डाउनलोड हटा दिए जाएंगे। पक्का?':'All downloads will be cleared. Sure?',[{text:copy(language,'cancel'),style:'cancel'},{text:language==='bn'?'মুছুন':language==='hi'?'हटाएँ':'Clear',style:'destructive',onPress:()=>p.update({downloads:[]})}])}>
        <T style={[styles.rowTitle,{color:'#B91C1C',flex:1}]}>{copy(language,'settingsClearAll')}</T>
        <View style={{backgroundColor:'#FEE2E2',borderRadius:10,paddingVertical:8,paddingHorizontal:12}}>
          <T style={{color:'#B91C1C',fontWeight:'900',fontSize:12}}>{language==='bn'?'মুছুন':language==='hi'?'हटाएँ':'Clear'}</T>
        </View>
      </Row>
    </Section>

    {/* Storage */}
    <Section title={copy(language,'settingsStorage')}>
      <Row icon="hard-drive" iconBg="#FEE2E2" iconColor="#B91C1C" onPress={()=>Alert.alert(copy(language,'settingsReset'),language==='bn'?'থিম, বুকমার্ক, ইতিহাস — সব ডেটা মুছে যাবে। নিশ্চিত?':language==='hi'?'थीम, बुकमार्क, इतिहास — सब डेटा मिटा दिया जाएगा। पक्का?':'Theme, bookmarks, history — all data will be deleted. Sure?',[{text:copy(language,'cancel'),style:'cancel'},{text:language==='bn'?'রিসেট':language==='hi'?'रीसेट':'Reset',style:'destructive',onPress:async()=>{p.update(initialState);await clearState();}}])}>
        <View style={{flex:1}}>
          <T style={[styles.rowTitle,{color:'#B91C1C'}]}>{copy(language,'settingsReset')}</T>
          <T style={{fontSize:11,color:t.muted,marginTop:1}}>{copy(language,'settingsResetDesc')}</T>
        </View>
        <View style={{backgroundColor:'#FEE2E2',borderRadius:10,paddingVertical:8,paddingHorizontal:12}}>
          <T style={{color:'#B91C1C',fontWeight:'900',fontSize:12}}>{language==='bn'?'রিসেট':language==='hi'?'रीसेट':'Reset'}</T>
        </View>
      </Row>
    </Section>

    {/* About */}
    <Section title={copy(language,'settingsAbout')}>
      <Row icon="book-open" iconBg={t.tint} iconColor={t.primary} onPress={()=>p.setScreen({type:'aboutApp'})}>
        <View style={{flex:1}}>
          <T style={[styles.rowTitle,{color:t.ink}]}>Lekhoni Kahini</T>
          <T style={{fontSize:11,color:t.muted,marginTop:1}}>{copy(language,'settingsAppDesc')}</T>
        </View>
        <Feather name="chevron-right" size={18} color={t.muted}/>
      </Row>
      <Sep/>
      <Row icon="star" iconBg={t.tint} iconColor={t.primary} onPress={()=>{try{Linking.openURL('https://play.google.com/store/apps/details?id=com.lekhoni.kahini')}catch{Share.share({message:'Lekhoni Kahini\nhttps://play.google.com/store/apps/details?id=com.lekhoni.kahini'})}}}>
        <T style={[styles.rowTitle,{color:t.ink,flex:1}]}>{copy(language,'settingsRate')}</T>
        <View style={{backgroundColor:t.tint,borderRadius:10,paddingVertical:8,paddingHorizontal:12}}>
          <T style={{color:t.primary,fontWeight:'900',fontSize:12}}>★</T>
        </View>
      </Row>
      <Sep/>
      <View style={[styles.menuItem,{backgroundColor:t.card}]}>
        <View style={[styles.menuIconBig,{backgroundColor:t.tint}]}><Feather name="info" size={18} color={t.primary}/></View>
        <View style={{flex:1}}>
          <T style={[styles.rowTitle,{color:t.ink}]}>Lekhoni Kahini</T>
          <T style={{fontSize:11,color:t.muted,marginTop:1}}>© 2026 Kawsar Hosen</T>
        </View>
         <T style={{color:t.muted,fontSize:12,fontWeight:'700'}}>v1.1.0</T>
      </View>
    </Section>
  </Page>}
function GoogleSignInButton({onResult,onError,theme:t,lang}:{onResult:(w:any,token:string)=>void;onError:(msg:string)=>void;theme:Theme;lang:Language}){
  const[loading,setLoading]=useState(false);

  const handlePress=async()=>{
    setLoading(true);onError('');
    try{
      const{GoogleSignin}=await import('@react-native-google-signin/google-signin');
      GoogleSignin.configure({
        webClientId:'940343114841-pd5po6gp5dij90nlp5k28tigp5qqr1rt.apps.googleusercontent.com',
        offlineAccess:true,
        scopes:['openid','profile','email'],
      });
      await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog:true});
      try{await GoogleSignin.signOut()}catch{}
      const userInfo=await GoogleSignin.signIn();
      const tokens=await GoogleSignin.getTokens();
      if(tokens.idToken){
        const w=await writerGoogleAuth(tokens.idToken);
        if(w)onResult(w,w.token);
        else onError(copy(lang,'networkError'));
      }else onError('No ID token received');
    }catch(e:any){
      if(e.code==='SIGN_IN_CANCELLED'){onError('');setLoading(false);return}
      onError(e.message||'Google sign-in failed');
    }finally{setLoading(false)}
  };

  return <Pressable disabled={loading} onPress={handlePress} style={{flexDirection:'row',alignItems:'center',justifyContent:'center',height:46,borderRadius:12,borderWidth:1.5,borderColor:t.line,backgroundColor:t.card,gap:10,opacity:loading?0.6:1}}>
    {loading?<ActivityIndicator color={t.ink} size="small"/>:<><GoogleIcon size={20}/>
    <T style={{color:t.ink,fontWeight:'600',fontSize:14}}>{copy(lang,'continueWithGoogle')}</T></>}
  </Pressable>
}

function Writer(p:C){
  const[authTab,setAuthTab]=useState<'login'|'register'>('login');
  const[form,setForm]=useState({username:'',writerName:'',email:'',password:''});
  const[privacyConsent,setPrivacyConsent]=useState(false);
  const[authErr,setAuthErr]=useState('');
  const[loading,setLoading]=useState(false);

  const handleGoogleResult=(w:any,token:string)=>{
    const wr=w.writer||w;
    p.update({writer:{id:wr.id,username:wr.username,writer_name:wr.writer_name,avatar_url:wr.avatar_url||undefined,bio:wr.bio||undefined},writerToken:token});
    fetchFollowedWriters(p.state.deviceId).then(fw=>p.update({followedWriters:(fw||[]) as any})).catch(()=>{});
  };
  const[studioTab,setStudioTab]=useState<'dashboard'|'stories'|'profile'|'notifications'|'followers'>('dashboard');
  const[unreadCount,setUnreadCount]=useState(0);
  const[showLogoutConfirm,setShowLogoutConfirm]=useState(false);
  const[showDeleteConfirm,setShowDeleteConfirm]=useState(false);
  const[deletingAccount,setDeletingAccount]=useState(false);
  const t=p.theme;
  const isLoggedIn=Boolean(p.state.writer);
  const token=p.state.writerToken||'';
  const lang=p.state.settings.language;

  useEffect(()=>{
    if(!isLoggedIn||!token)return;
    fetchWriterNotifications(token).then(n=>{
      if(n)setUnreadCount(n.filter(x=>!x.is_read).length);
    }).catch(()=>{});
  },[isLoggedIn,token,studioTab]);

  const handleAuth=async()=>{
    if(!form.password){setAuthErr(tr(p,'allFieldsRequired'));return}
    if(authTab==='register'){
      if(!form.username.trim()||!form.writerName.trim()||!form.email.trim()){setAuthErr(tr(p,'allFieldsRequired'));return}
      if(!privacyConsent){setAuthErr(lang==='bn'?'গোপনীয়তা নীতি মেনে নিন':lang==='hi'?'गोपनीयता नीति स्वीकार करें':'Please agree to Privacy Policy');return}
    }else{
      if(!form.email.trim()){setAuthErr(tr(p,'allFieldsRequired'));return}
    }
    setLoading(true);setAuthErr('');
    try{
      if(authTab==='register'){
        const w=await writerSignup(form.username.trim(),form.writerName.trim(),form.email.trim(),form.password);
        if(w){p.update({writer:{id:w.writer.id,username:w.writer.username,writer_name:w.writer.writer_name,avatar_url:w.writer.avatar_url||undefined,bio:w.writer.bio||undefined},writerToken:w.token});setForm({username:'',writerName:'',email:'',password:''});
          fetchFollowedWriters(p.state.deviceId).then(fw=>p.update({followedWriters:fw as any})).catch(()=>{});}
        else{setAuthErr(tr(p,'accountExists'))}
      }else{
        const w=await writerLogin(form.email.trim(),form.password);
        if(w){p.update({writer:{id:w.writer.id,username:w.writer.username,writer_name:w.writer.writer_name,avatar_url:w.writer.avatar_url||undefined,bio:w.writer.bio||undefined},writerToken:w.token});setForm({username:'',writerName:'',email:'',password:''});
          fetchFollowedWriters(p.state.deviceId).then(fw=>p.update({followedWriters:fw as any})).catch(()=>{});}
        else setAuthErr(tr(p,'wrongCredentials'))
      }
    }catch{setAuthErr(tr(p,'networkError'))}finally{setLoading(false)}
  };

  if(!isLoggedIn)return <KeyboardAvoidingView style={{flex:1,backgroundColor:t.bg}} behavior={Platform.OS==='ios'?'padding':'height'}>
    <ScrollView contentContainerStyle={{flexGrow:1,padding:22,paddingTop:50}} keyboardShouldPersistTaps="handled">
    <View style={{alignItems:'center',marginBottom:24}}>
      <Image source={require('./assets/adaptive-icon.png')} style={{width:72,height:72,borderRadius:18}} resizeMode="contain"/>
      <T style={{color:t.ink,fontSize:20,fontWeight:'600',marginTop:14,textAlign:'center'}}>{tr(p,'welcomeWriter')}</T>
      <T style={{color:t.muted,fontSize:13,marginTop:4,textAlign:'center'}}>{tr(p,'storiesWaiting')}</T>
    </View>
    <View style={{backgroundColor:t.card,borderRadius:18,padding:20,marginBottom:16,borderWidth:1,borderColor:t.line}}>
      <View style={{flexDirection:'row',backgroundColor:t.bg,borderRadius:12,padding:3,marginBottom:18}}>
        <Pressable onPress={()=>{setAuthTab('login');setAuthErr('')}} style={{flex:1,borderRadius:10,paddingVertical:10,alignItems:'center',backgroundColor:authTab==='login'?t.primary:'transparent'}}><T style={{color:authTab==='login'?'#fff':t.muted,fontWeight:'600',fontSize:13}}>{tr(p,'login')}</T></Pressable>
        <Pressable onPress={()=>{setAuthTab('register');setAuthErr('')}} style={{flex:1,borderRadius:10,paddingVertical:10,alignItems:'center',backgroundColor:authTab==='register'?t.primary:'transparent'}}><T style={{color:authTab==='register'?'#fff':t.muted,fontWeight:'600',fontSize:13}}>{tr(p,'register')}</T></Pressable>
      </View>
      {authTab==='register'&&<>
      <View style={{marginBottom:12}}>
        <T style={{color:t.muted,fontSize:11,fontWeight:'500',marginBottom:5,marginLeft:4}}>{tr(p,'username')}</T>
        <View style={{flexDirection:'row',alignItems:'center',backgroundColor:t.bg,borderRadius:12,borderWidth:1,borderColor:t.line,paddingHorizontal:12,height:46}}>
          <Feather name="at-sign" size={16} color={t.muted} style={{marginRight:8}}/>
          <TextInput value={form.username} onChangeText={v=>setForm({...form,username:v})} placeholder={tr(p,'username')} placeholderTextColor={t.muted+'88'} autoCapitalize="none" style={{flex:1,color:t.ink,fontSize:14,fontWeight:'400',fontFamily:GF()}}/>
        </View>
      </View>
      <View style={{marginBottom:12}}>
        <T style={{color:t.muted,fontSize:11,fontWeight:'500',marginBottom:5,marginLeft:4}}>{tr(p,'writerName')}</T>
        <View style={{flexDirection:'row',alignItems:'center',backgroundColor:t.bg,borderRadius:12,borderWidth:1,borderColor:t.line,paddingHorizontal:12,height:46}}>
          <Feather name="feather" size={16} color={t.muted} style={{marginRight:8}}/>
          <TextInput value={form.writerName} onChangeText={v=>setForm({...form,writerName:v})} placeholder={tr(p,'writerName')} placeholderTextColor={t.muted+'88'} style={{flex:1,color:t.ink,fontSize:14,fontWeight:'400',fontFamily:GF()}}/>
        </View>
      </View>
      </>}
      <View style={{marginBottom:12}}>
        <T style={{color:t.muted,fontSize:11,fontWeight:'500',marginBottom:5,marginLeft:4}}>{authTab==='login'?tr(p,'emailOrUsername'):tr(p,'email')}</T>
        <View style={{flexDirection:'row',alignItems:'center',backgroundColor:t.bg,borderRadius:12,borderWidth:1,borderColor:t.line,paddingHorizontal:12,height:46}}>
          <Feather name="user" size={16} color={t.muted} style={{marginRight:8}}/>
          <TextInput value={form.email} onChangeText={v=>setForm({...form,email:v})} placeholder={authTab==='login'?tr(p,'emailOrUsername'):tr(p,'email')} placeholderTextColor={t.muted+'88'} autoCapitalize="none" style={{flex:1,color:t.ink,fontSize:14,fontWeight:'400',fontFamily:GF()}}/>
        </View>
      </View>
      <View style={{marginBottom:authErr?8:16}}>
        <T style={{color:t.muted,fontSize:11,fontWeight:'500',marginBottom:5,marginLeft:4}}>{tr(p,'password')}</T>
        <View style={{flexDirection:'row',alignItems:'center',backgroundColor:t.bg,borderRadius:12,borderWidth:1,borderColor:t.line,paddingHorizontal:12,height:46}}>
          <Feather name="lock" size={16} color={t.muted} style={{marginRight:8}}/>
          <TextInput value={form.password} onChangeText={v=>setForm({...form,password:v})} placeholder={tr(p,'password')} placeholderTextColor={t.muted+'88'} secureTextEntry style={{flex:1,color:t.ink,fontSize:14,fontWeight:'400',fontFamily:GF()}}/>
        </View>
      </View>
      {authTab==='register'&&<Pressable onPress={()=>setPrivacyConsent(!privacyConsent)} style={{flexDirection:'row',alignItems:'flex-start',gap:8,marginBottom:14,marginTop:2}}>
        <View style={{width:20,height:20,borderRadius:6,borderWidth:1.5,borderColor:privacyConsent?t.primary:t.line,backgroundColor:privacyConsent?t.primary:'transparent',alignItems:'center',justifyContent:'center',marginTop:1}}>
          {privacyConsent&&<Feather name="check" size={12} color="#fff"/>}
        </View>
        <T style={{fontSize:12,color:t.muted,flex:1,lineHeight:18}}>{tr(p,'agreeToPrivacy')}{' '}
          <T onPress={()=>p.setScreen({type:'terms'})} style={{color:t.primary,fontWeight:'700',textDecorationLine:'underline'}}>{tr(p,'privacyPolicyLink')}</T>
        </T>
      </Pressable>}
      {authErr?<View style={{backgroundColor:'#FEF2F2',borderRadius:10,padding:10,marginBottom:12,flexDirection:'row',alignItems:'center',gap:6}}><Feather name="alert-circle" size={14} color="#EF4444"/><T style={{color:'#EF4444',fontSize:12,fontWeight:'500',flex:1}}>{authErr}</T></View>:null}
      <Pressable disabled={loading} onPress={handleAuth} style={{backgroundColor:t.primary,borderRadius:12,height:46,alignItems:'center',justifyContent:'center',opacity:loading?0.6:1}}>
        {loading?<ActivityIndicator color="#fff" size="small"/>:<T style={{color:'#fff',fontWeight:'600',fontSize:14}}>{authTab==='register'?tr(p,'createAccount'):tr(p,'login')}</T>}
      </Pressable>
      <View style={{flexDirection:'row',alignItems:'center',marginVertical:16}}>
        <View style={{flex:1,height:1,backgroundColor:t.line}}/>
        <T style={{color:t.muted,fontSize:12,marginHorizontal:12}}>{tr(p,'or')}</T>
        <View style={{flex:1,height:1,backgroundColor:t.line}}/>
      </View>
      <GoogleSignInButton onResult={handleGoogleResult} onError={setAuthErr} theme={t} lang={lang}/>
      <T style={{color:t.muted,fontSize:12,textAlign:'center',marginTop:14}}>
        {authTab==='login'?tr(p,'noAccount'):tr(p,'alreadyAccount')}{' '}
        <T onPress={()=>{setAuthTab(authTab==='login'?'register':'login');setAuthErr('')}} style={{color:t.primary,fontWeight:'600'}}>
          {authTab==='login'?tr(p,'registerHere'):tr(p,'loginHere')}</T>
      </T>
    </View>
    </ScrollView>
  </KeyboardAvoidingView>;

  const tabs:[string,string,string][]=[['dashboard',tr(p,'dashboard'),'bar-chart-2'],['stories',tr(p,'myStories'),'book-open'],['profile',tr(p,'profile'),'user']];

  return <Page theme={t}>
    <View style={{flexDirection:'row',alignItems:'center',backgroundColor:t.card,borderRadius:16,padding:14,marginBottom:16,borderWidth:1,borderColor:t.line}}>
      {p.state.writer?.avatar_url?<Image source={{uri:p.state.writer.avatar_url}} style={{width:48,height:48,borderRadius:24}}/>:<View style={{width:48,height:48,borderRadius:24,backgroundColor:t.primary,alignItems:'center',justifyContent:'center',elevation:3,shadowColor:t.primary,shadowOffset:{width:0,height:3},shadowOpacity:0.25,shadowRadius:6}}>
        <T style={{fontSize:20,fontWeight:'900',color:'#fff'}}>{p.state.writer?.writer_name?.[0]?.toUpperCase()||'?'}</T>
      </View>}
      <View style={{flex:1,marginLeft:12}}>
        <T numberOfLines={1} style={{fontSize:17,fontWeight:'900',color:t.ink}}>{p.state.writer?.writer_name}</T>
        <T style={{fontSize:12,color:t.muted,marginTop:1}}>{tr(p,'writerStudio')}</T>
      </View>
      <Pressable onPress={()=>{setStudioTab('notifications');setUnreadCount(0)}} style={{width:40,height:40,borderRadius:12,backgroundColor:t.tint,alignItems:'center',justifyContent:'center',marginRight:8}}>
        <Feather name="bell" size={18} color={t.primary}/>
        {unreadCount>0&&<View style={{position:'absolute',top:-3,right:-3,backgroundColor:'#EF4444',borderRadius:8,minWidth:16,height:16,alignItems:'center',justifyContent:'center',paddingHorizontal:4}}>
          <T style={{color:'#fff',fontSize:9,fontWeight:'900'}}>{unreadCount>9?'9+':unreadCount}</T>
        </View>}
      </Pressable>
      <Pressable onPress={()=>setShowLogoutConfirm(true)} style={{width:36,height:36,borderRadius:10,backgroundColor:t.tint,alignItems:'center',justifyContent:'center'}}>
        <Feather name="log-out" size={16} color={t.primary}/>
      </Pressable>
    </View>
    <View style={{flexDirection:'row',gap:5,marginBottom:18}}>
      {tabs.map(([key,label,icon])=><Pressable key={key} onPress={()=>{setStudioTab(key as any);if(key==='notifications')setUnreadCount(0)}} style={{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:4,backgroundColor:studioTab===key?t.primary:t.card,borderRadius:10,paddingVertical:9,borderWidth:1,borderColor:studioTab===key?t.primary:t.line}}>
        <Feather name={icon as any} size={13} color={studioTab===key?'#fff':t.muted}/>
        <T style={{color:studioTab===key?'#fff':t.muted,fontWeight:'800',fontSize:11}}>{label}</T>
        {key==='notifications'&&unreadCount>0&&<View style={{backgroundColor:studioTab===key?'rgba(255,255,255,0.3)':'#EF4444',borderRadius:6,minWidth:14,height:14,alignItems:'center',justifyContent:'center',paddingHorizontal:3}}>
          <T style={{color:'#fff',fontSize:8,fontWeight:'900'}}>{unreadCount>9?'9+':unreadCount}</T>
        </View>}
      </Pressable>)}
    </View>
    {studioTab==='dashboard'&&<WriterDashboard token={token} theme={t} lang={lang}/>}
    {studioTab==='stories'&&<WriterStories token={token} theme={t} lang={lang} categories={p.allCategories.map(c=>c[0])} setScreen={p.setScreen} onRefresh={p.syncRemote}/>}
    {studioTab==='profile'&&<WriterProfileStudio token={token} theme={t} writer={p.state.writer} lang={lang} onUpdate={(patch)=>p.update({writer:{...p.state.writer!,...patch}})} onDeleteAccount={()=>setShowDeleteConfirm(true)}/>}
    {studioTab==='notifications'&&<WriterNotifs token={token} theme={t} lang={lang} deviceID={p.state.deviceId} p={p}/>}
    {showLogoutConfirm&&<View style={{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'center',alignItems:'center',padding:24,zIndex:999}}>
      <View style={{width:'100%',backgroundColor:t.card,borderRadius:22,padding:24,alignItems:'center',borderWidth:1,borderColor:t.line}}>
        <View style={{width:56,height:56,borderRadius:28,backgroundColor:'#FEE2E2',alignItems:'center',justifyContent:'center',marginBottom:16}}>
          <Feather name="log-out" size={28} color="#EF4444"/>
        </View>
        <T style={{fontSize:18,fontWeight:'900',color:t.ink,textAlign:'center',marginBottom:8}}>লগ আউট করবেন?</T>
        <T style={{fontSize:13,color:t.muted,textAlign:'center',lineHeight:20,marginBottom:20}}>
          {lang==='bn'?'আপনি রাইটার স্টুডিও থেকে লগ আউট করতে চাচ্ছেন। লগ আউট করলে আপনাকে আবার লগইন করতে হবে।':
          lang==='hi'?'आप राइटर स्टूडियो से लॉग आउट करने जा रहे हैं। लॉग आउट करने के बाद आपको फिर से लॉगिन करना होगा।':
          'You are about to log out from Writer Studio. You will need to log in again.'}
        </T>
        <View style={{flexDirection:'row',gap:10,width:'100%'}}>
          <Pressable onPress={()=>setShowLogoutConfirm(false)} style={{flex:1,height:48,borderRadius:14,backgroundColor:t.tint,alignItems:'center',justifyContent:'center'}}>
            <T style={{color:t.primary,fontWeight:'800',fontSize:14}}>{lang==='bn'?'বাতিল':lang==='hi'?'रद्द करें':'Cancel'}</T>
          </Pressable>
          <Pressable onPress={()=>{setShowLogoutConfirm(false);p.update({writer:null,writerToken:null,followedWriters:[]})}} style={{flex:1,height:48,borderRadius:14,backgroundColor:'#EF4444',alignItems:'center',justifyContent:'center'}}>
            <T style={{color:'#fff',fontWeight:'800',fontSize:14}}>{lang==='bn'?'হ্যাঁ, লগ আউট':lang==='hi'?'हाँ, लॉग आउट':'Yes, Log out'}</T>
          </Pressable>
        </View>
      </View>
    </View>}
    {showDeleteConfirm&&<View style={{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'center',alignItems:'center',padding:24,zIndex:999}}>
      <View style={{width:'100%',backgroundColor:t.card,borderRadius:22,padding:24,alignItems:'center',borderWidth:1,borderColor:t.line}}>
        <View style={{width:56,height:56,borderRadius:28,backgroundColor:'#FEE2E2',alignItems:'center',justifyContent:'center',marginBottom:16}}>
          <Feather name="trash-2" size={28} color="#EF4444"/>
        </View>
        <T style={{fontSize:18,fontWeight:'900',color:t.ink,textAlign:'center',marginBottom:8}}>{lang==='bn'?'অ্যাকাউন্ট মুছে ফেলবেন?':lang==='hi'?'खाता हटाएँ?':'Delete Account?'}</T>
        <T style={{fontSize:13,color:t.muted,textAlign:'center',lineHeight:20,marginBottom:20}}>
          {lang==='bn'?'এটি অপরিবর্তনীয়! আপনার সমস্ত গল্প, অনুসারক এবং অ্যাকাউন্ট তথ্য মুছে ফেলা হবে।':
          lang==='hi'?'यह अपरिवर्तनीय है! आपकी सभी कहानियाँ, अनुयायी और खाता जानकारी हटा दी जाएगी।':
          'This is irreversible! All your stories, followers and account data will be deleted.'}
        </T>
        <View style={{flexDirection:'row',gap:10,width:'100%'}}>
          <Pressable onPress={()=>setShowDeleteConfirm(false)} style={{flex:1,height:48,borderRadius:14,backgroundColor:t.tint,alignItems:'center',justifyContent:'center'}}>
            <T style={{color:t.primary,fontWeight:'800',fontSize:14}}>{lang==='bn'?'বাতিল':lang==='hi'?'रद्द करें':'Cancel'}</T>
          </Pressable>
          <Pressable onPress={async()=>{setDeletingAccount(true);const r=await deleteWriterAccount(token);setDeletingAccount(false);if(r.ok){setShowDeleteConfirm(false);p.update({writer:null,writerToken:null,followedWriters:[]})}else{Alert.alert('',r.error||'Failed')}}} disabled={deletingAccount} style={{flex:1,height:48,borderRadius:14,backgroundColor:'#EF4444',alignItems:'center',justifyContent:'center',opacity:deletingAccount?0.6:1}}>
            {deletingAccount?<ActivityIndicator color="#fff" size="small"/>:<T style={{color:'#fff',fontWeight:'800',fontSize:14}}>{lang==='bn'?'হ্যাঁ, মুছুন':lang==='hi'?'हाँ, हटाएँ':'Yes, Delete'}</T>}
          </Pressable>
        </View>
      </View>
    </View>}
  </Page>}

function WriterDashboard({token,theme:t,lang}:{token:string;theme:Theme;lang:Language}){
  const[d,setD]=useState<any>({stories:0,totalViews:0,followers:0,published:0,pending:0,publishedStories:[],todayViews:0,weekViews:0,monthViews:0});
  const[loading,setLoading]=useState(true);
  useEffect(()=>{fetchWriterDashboard(token).then(s=>{if(s)setD(s)}).finally(()=>setLoading(false))},[token]);
  if(loading)return <View style={{alignItems:'center',paddingVertical:60}}><ActivityIndicator size="large" color={t.primary}/></View>;
  const isEligible=d.followers>=1000&&d.totalViews>=5000;
  return <ScrollView showsVerticalScrollIndicator={false}>
    <View style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:14}}>
      {[{icon:'book-open',label:copy(lang,'myStories'),value:d.stories},{icon:'eye',label:copy(lang,'totalViews'),value:d.totalViews},{icon:'users',label:copy(lang,'followers'),value:d.followers},{icon:'check-circle',label:copy(lang,'published'),value:d.published}].map((c,i)=>
      <View key={i} style={{flex:1,minWidth:'45%',backgroundColor:t.card,borderRadius:12,padding:12,borderWidth:1,borderColor:t.line,alignItems:'center'}}>
        <Feather name={c.icon as any} size={16} color={t.muted}/>
        <T style={{fontSize:18,fontWeight:'900',color:t.ink,marginTop:4}}>{c.value}</T>
        <T style={{fontSize:10,fontWeight:'600',color:t.muted,marginTop:2}}>{c.label}</T>
      </View>)}
    </View>
    {d.pending>0&&<View style={{backgroundColor:'#FEF3C7',borderRadius:12,padding:12,marginBottom:14,flexDirection:'row',alignItems:'center',gap:8}}>
      <Feather name="clock" size={16} color="#D97706"/>
      <T style={{fontSize:12,fontWeight:'700',color:'#92400E',flex:1}}>{d.pending} {copy(lang,'pendingReview')}</T>
    </View>}
    <View style={{backgroundColor:t.card,borderRadius:16,padding:14,marginBottom:14,borderWidth:1,borderColor:t.line}}>
      <View style={{flexDirection:'row',alignItems:'center',gap:8,marginBottom:12}}>
        <View style={{width:32,height:32,borderRadius:8,backgroundColor:'#6366F118',alignItems:'center',justifyContent:'center'}}><Feather name="bar-chart-2" size={16} color="#6366F1"/></View>
        <T style={{fontSize:14,fontWeight:'800',color:t.ink}}>{copy(lang,'viewsAnalytics')}</T>
      </View>
      <View style={{flexDirection:'row',gap:8}}>
        {[{label:copy(lang,'today'),value:d.todayViews,color:'#10B981'},{label:copy(lang,'thisWeek'),value:d.weekViews,color:'#6366F1'},{label:copy(lang,'thisMonth'),value:d.monthViews,color:'#F59E0B'}].map((v,i)=>
        <View key={i} style={{flex:1,backgroundColor:v.color+'12',borderRadius:10,padding:10,alignItems:'center'}}>
          <T style={{fontSize:18,fontWeight:'900',color:v.color}}>{v.value}</T>
          <T style={{fontSize:9,fontWeight:'700',color:v.color,marginTop:2}}>{v.label}</T>
        </View>)}
      </View>
    </View>
    {d.publishedStories?.length>0&&<View style={{backgroundColor:t.card,borderRadius:16,padding:14,marginBottom:14,borderWidth:1,borderColor:t.line}}>
      <View style={{flexDirection:'row',alignItems:'center',gap:8,marginBottom:12}}>
        <View style={{width:32,height:32,borderRadius:8,backgroundColor:t.primary+'18',alignItems:'center',justifyContent:'center'}}><Feather name="book-open" size={16} color={t.primary}/></View>
        <T style={{fontSize:14,fontWeight:'800',color:t.ink}}>{copy(lang,'publishedStories')}</T>
      </View>
      {d.publishedStories.map((s:any,i:number)=>
      <View key={s.id} style={{flexDirection:'row',alignItems:'center',paddingVertical:10,borderBottomWidth:i<d.publishedStories.length-1?1:0,borderBottomColor:t.line}}>
        {s.cover_url?<Image source={{uri:s.cover_url}} style={{width:40,height:30,borderRadius:6,marginRight:10}}/>:
        <View style={{width:40,height:30,borderRadius:6,backgroundColor:t.tint,alignItems:'center',justifyContent:'center',marginRight:10}}><Feather name="book" size={12} color={t.muted}/></View>}
        <View style={{flex:1}}>
          <T numberOfLines={1} style={{fontSize:13,fontWeight:'700',color:t.ink}}>{s.title}</T>
          <T style={{fontSize:10,color:t.muted,marginTop:2}}>{copy(lang,'views')}: {s.views}</T>
        </View>
        <View style={{flexDirection:'row',alignItems:'center',gap:4,backgroundColor:'#10B98115',borderRadius:8,paddingHorizontal:8,paddingVertical:4}}>
          <Feather name="eye" size={12} color="#10B981"/>
          <T style={{fontSize:11,fontWeight:'700',color:'#10B981'}}>{s.views}</T>
        </View>
    </View>)}
  </View>}
    <View style={{backgroundColor:t.card,borderRadius:16,padding:16,marginBottom:20,borderWidth:1,borderColor:isEligible?'#10B981':t.line}}>
      <View style={{flexDirection:'row',alignItems:'center',gap:10,marginBottom:14}}>
        <View style={{width:40,height:40,borderRadius:12,backgroundColor:isEligible?'#10B981'+'18':'#F59E0B'+'18',alignItems:'center',justifyContent:'center'}}>
          {isEligible?<Svg width={22} height={22} viewBox="0 0 24 24" fill="none"><Path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#10B981"/></Svg>:
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="10" stroke="#F59E0B" strokeWidth="2"/><Path d="M12 6V12L16 14" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"/></Svg>}
        </View>
        <View style={{flex:1}}>
          <T style={{fontSize:14,fontWeight:'800',color:t.ink}}>{copy(lang,'monetization')}</T>
          <T style={{fontSize:11,color:t.muted,marginTop:2}}>{isEligible?copy(lang,'eligibleForMonetization'):copy(lang,'monetizationProgress')}</T>
        </View>
      </View>
      {!isEligible&&<View style={{marginBottom:14}}>
        <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:6}}>
          <T style={{fontSize:11,fontWeight:'600',color:t.muted}}>{copy(lang,'followers')}: {d.followers}/1,000</T>
          <T style={{fontSize:11,fontWeight:'700',color:d.followers>=1000?'#10B981':t.muted}}>{Math.min(100,Math.floor(d.followers/10))}%</T>
        </View>
        <View style={{height:6,backgroundColor:t.line,borderRadius:3,overflow:'hidden'}}>
          <View style={{height:6,flex:Math.min(100,Math.floor(d.followers/10))/100,maxWidth:'100%',backgroundColor:d.followers>=1000?'#10B981':t.primary,borderRadius:3}}/>
        </View>
        <View style={{flexDirection:'row',justifyContent:'space-between',marginTop:8,marginBottom:6}}>
          <T style={{fontSize:11,fontWeight:'600',color:t.muted}}>{copy(lang,'totalViews')}: {d.totalViews}/5,000</T>
          <T style={{fontSize:11,fontWeight:'700',color:d.totalViews>=5000?'#10B981':t.muted}}>{Math.min(100,Math.floor(d.totalViews/50))}%</T>
        </View>
        <View style={{height:6,backgroundColor:t.line,borderRadius:3,overflow:'hidden'}}>
          <View style={{height:6,flex:Math.min(100,Math.floor(d.totalViews/50))/100,maxWidth:'100%',backgroundColor:d.totalViews>=5000?'#10B981':'#6366F1',borderRadius:3}}/>
        </View>
      </View>}
      <View style={{backgroundColor:t.tint,borderRadius:10,padding:12}}>
        <T style={{fontSize:11,fontWeight:'700',color:t.ink,marginBottom:6}}>{copy(lang,'howMonetizationWorks')}</T>
        <T style={{fontSize:10,color:t.muted,lineHeight:16}}>
          {copy(lang,'monetizationDesc1')+'\n\n'+
          copy(lang,'monetizationDesc2')+'\n\n'+
          copy(lang,'monetizationDesc3')}
        </T>
      </View>
    </View>
  </ScrollView>}

function NewStoryScreen({token,theme:t,lang,categories,onBack,onCreated}:{token:string;theme:Theme;lang:Language;categories:string[];onBack:()=>void;onCreated:()=>void}){
  const insets=useSafeAreaInsets();
  const[title,setTitle]=useState('');
  const[desc,setDesc]=useState('');
  const[cover,setCover]=useState('');
  const[coverPreview,setCoverPreview]=useState('');
  const[category,setCategory]=useState('');
  const[catOpen,setCatOpen]=useState(false);
  const[displayStatus,setDisplayStatus]=useState<'complete'|'ongoing'>('ongoing');
  const[saving,setSaving]=useState(false);
  const[uploadingImg,setUploadingImg]=useState(false);
  const[showNewCat,setShowNewCat]=useState(false);
  const[newCatName,setNewCatName]=useState('');
  const[localCats,setLocalCats]=useState<string[]>(categories);
  const[chTitle,setChTitle]=useState('');
  const[chBody,setChBody]=useState('');
  const[showPreview,setShowPreview]=useState(false);
  const[hideTitle,setHideTitle]=useState(false);
  const TITLE_MAX=60;const DESC_MAX=500;
  const missingFields:string[]=[];
  if(!title.trim())missingFields.push(copy(lang,'storyTitle'));
  if(!chTitle.trim()||!chBody.trim())missingFields.push(copy(lang,'firstChapter'));
  if(!category&&localCats.length>0)missingFields.push(copy(lang,'selectCategory'));
  const canPublish=missingFields.length===0;
  const pickCover=async()=>{setUploadingImg(true);const url=await pickAndResizeImage('cover');if(url){setCover(url);setCoverPreview(url)}setUploadingImg(false)};
  const handleCreate=async()=>{
    if(!canPublish)return;setSaving(true);
    const r=await createWriterStory(token,title.trim(),desc.trim(),category||localCats[0]||'',cover||undefined,displayStatus==='ongoing'?'ongoing':'new',displayStatus==='ongoing'?'ongoing':'complete',hideTitle);
    if(r){
      if(chTitle.trim()&&chBody.trim())await createStoryChapter(token,r.id,chTitle.trim(),chBody.trim());
      onCreated();
    }
    setSaving(false);
  };
  const addNewCat=()=>{if(newCatName.trim()&&!localCats.includes(newCatName.trim())){setLocalCats(c=>[...c,newCatName.trim()]);setCategory(newCatName.trim());setNewCatName('');setShowNewCat(false)}};
  const fmtCover=():React.ReactNode=>{
    if(!coverPreview)return <View style={{width:80,height:110,borderRadius:10,backgroundColor:t.primary+'22',alignItems:'center',justifyContent:'center'}}><Feather name="book-open" size={22} color={t.primary}/></View>;
    if(hideTitle)return <Image source={{uri:coverPreview}} style={{width:80,height:110,borderRadius:10}} resizeMode="cover"/>;
    return <View style={{width:80,height:110,borderRadius:10,overflow:'hidden',backgroundColor:'#123E39'}}><Image source={{uri:coverPreview}} style={{position:'absolute',top:0,left:0,right:0,bottom:0}} resizeMode="cover"/><View style={{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.2)'}}/><Feather name="book-open" size={18} color="#F5C660" style={{position:'absolute',top:10,left:10}}/><T numberOfLines={2} style={{position:'absolute',bottom:10,left:10,right:10,color:'#fff',fontWeight:'900',fontSize:11,lineHeight:14}}>{title||'...'}</T></View>;
  };
  return <View style={{flex:1,backgroundColor:t.bg}}>
    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:14,paddingTop:insets.top+8,paddingBottom:10,backgroundColor:t.card,borderBottomWidth:1,borderBottomColor:t.line}}>
      <Pressable onPress={onBack} style={{flexDirection:'row',alignItems:'center',gap:4}}>
        <Feather name="arrow-left" size={18} color={t.primary}/>
        <T style={{fontSize:13,fontWeight:'700',color:t.primary}}>{copy(lang,'cancel')}</T>
      </Pressable>
      <View style={{alignItems:'center'}}>
        <Feather name="feather" size={16} color={t.primary}/>
        <T style={{fontSize:10,fontWeight:'800',color:t.primary,marginTop:1}}>{copy(lang,'writeStudio')}</T>
      </View>
      <Pressable disabled={saving||!canPublish} onPress={handleCreate} style={{backgroundColor:t.primary,borderRadius:8,paddingHorizontal:12,paddingVertical:6,opacity:saving||!canPublish?0.5:1}}>
        {saving?<ActivityIndicator color="#fff" size="small"/>:<T style={{color:'#fff',fontWeight:'800',fontSize:11}}>{copy(lang,'publishStory')}</T>}
      </Pressable>
    </View>
    <ScrollView contentContainerStyle={{padding:14,paddingBottom:50}} keyboardShouldPersistTaps="handled">
      {!canPublish&&<View style={{backgroundColor:'#FEF3C7',borderRadius:10,padding:12,marginBottom:16,borderWidth:1,borderColor:'#F59E0B',flexDirection:'row',alignItems:'flex-start',gap:8}}>
        <Feather name="alert-circle" size={16} color="#D97706" style={{marginTop:1}}/>
        <View style={{flex:1}}>
          <T style={{fontSize:11,fontWeight:'700',color:'#92400E',marginBottom:3}}>{copy(lang,'fillRequired')}</T>
          <T style={{fontSize:10,color:'#78350F',lineHeight:16}}>{missingFields.join(', ')}</T>
        </View>
      </View>}
      <View style={{backgroundColor:t.primary+'0D',borderRadius:10,padding:12,marginBottom:16,borderWidth:1,borderColor:t.primary+'20'}}>
        <View style={{flexDirection:'row',alignItems:'center',gap:6,marginBottom:4}}>
          <Feather name="info" size={14} color={t.primary}/>
          <T style={{fontSize:11,fontWeight:'700',color:t.primary}}>{copy(lang,'guideTitle')}</T>
        </View>
        <T style={{fontSize:11,color:t.muted,lineHeight:17}}>{copy(lang,'guideDesc')}</T>
      </View>
      <View style={{marginBottom:16}}>
        <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
          <T style={{fontSize:11,fontWeight:'700',color:t.muted}}>{copy(lang,'storyTitle')}</T>
          <T style={{fontSize:10,color:title.length>=TITLE_MAX-5?'#EF4444':t.muted}}>{title.length}/{TITLE_MAX}</T>
        </View>
        <TextInput value={title} onChangeText={v=>{if(v.length<=TITLE_MAX)setTitle(v)}} placeholder={lang==='bn'?'\u0986\u09aa\u09A8\u09BE\u09B0 \u0997\u09B2\u09CD\u09AA\u09C7\u09B0 \u09A8\u09BE\u09AE...':lang==='hi'?'\u0905\u092A\u0928\u0940 \u0915\u0939\u093E\u0928\u0940 \u0915\u093E \u0928\u093E\u092E...':'Your story title...'} placeholderTextColor={t.muted} style={{color:t.ink,fontSize:16,fontWeight:'800',backgroundColor:t.card,borderWidth:1.5,borderColor:title.length>=TITLE_MAX-5?'#EF4444':title.length>0?t.primary:t.line,borderRadius:12,padding:12,fontFamily:GF()}}/>
      </View>
      <View style={{marginBottom:16}}>
        <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
          <T style={{fontSize:11,fontWeight:'700',color:t.muted}}>{copy(lang,'storyDesc')}</T>
          {desc.length>0&&<T style={{fontSize:10,color:desc.length>=DESC_MAX-50?'#F59E0B':t.muted}}>{desc.length}/{DESC_MAX}</T>}
        </View>
        <TextInput value={desc} onChangeText={v=>{if(v.length<=DESC_MAX)setDesc(v)}} multiline placeholder={copy(lang,'storyDescHint')} placeholderTextColor={t.muted+'88'} style={{color:t.ink,fontSize:13,minHeight:80,maxHeight:150,textAlignVertical:'top',padding:12,fontFamily:GF(),lineHeight:20,backgroundColor:t.card,borderWidth:1,borderColor:desc.length>0?t.primary:t.line,borderRadius:12}}/>
      </View>
      <View style={{marginBottom:16}}>
        <T style={{fontSize:11,fontWeight:'700',color:t.muted,marginBottom:6}}>{copy(lang,'storyType')}</T>
        <View style={{flexDirection:'row',gap:8}}>
          {([['ongoing',copy(lang,'statusOngoing')],['complete',copy(lang,'statusComplete')]] as const).map(([k,l])=>(
            <Pressable key={k} onPress={()=>setDisplayStatus(k)} style={{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,backgroundColor:displayStatus===k?t.primary:t.card,borderWidth:1.5,borderColor:displayStatus===k?t.primary:t.line,borderRadius:10,paddingVertical:10}}>
              <View style={{width:16,height:16,borderRadius:8,borderWidth:2,borderColor:displayStatus===k?'#fff':t.muted,alignItems:'center',justifyContent:'center'}}>
                {displayStatus===k&&<View style={{width:8,height:8,borderRadius:4,backgroundColor:'#fff'}}/>}
              </View>
              <T style={{fontSize:12,fontWeight:'800',color:displayStatus===k?'#fff':t.ink}}>{l}</T>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={{marginBottom:16}}>
        <T style={{fontSize:11,fontWeight:'700',color:t.muted,marginBottom:6}}>{copy(lang,'addCover')}</T>
        <Pressable onPress={pickCover} disabled={uploadingImg} style={{borderRadius:12,borderWidth:1.5,borderColor:t.line,borderStyle:'dashed',overflow:'hidden'}}>
          {uploadingImg?<View style={{height:100,alignItems:'center',justifyContent:'center',backgroundColor:t.card}}><ActivityIndicator size="small" color={t.primary}/></View>:
          coverPreview?<View style={{height:120,backgroundColor:t.card,alignItems:'center',justifyContent:'center'}}><Image source={{uri:coverPreview}} style={{width:100,height:100,borderRadius:10}} resizeMode="cover"/><View style={{flexDirection:'row',alignItems:'center',gap:5,marginTop:6}}><Feather name="refresh-cw" size={12} color={t.muted}/><T style={{fontSize:11,color:t.muted,fontWeight:'600'}}>{copy(lang,'changePhoto')}</T></View></View>:
          <View style={{height:100,alignItems:'center',justifyContent:'center',gap:6,backgroundColor:t.card}}>
            <Feather name="image" size={22} color={t.muted}/>
            <T style={{fontSize:11,color:t.muted,fontWeight:'600'}}>{copy(lang,'tapToUpload')}</T>
          </View>}
        </Pressable>
        {coverPreview&&<Pressable onPress={()=>setHideTitle(!hideTitle)} style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:10,backgroundColor:t.card,borderRadius:10,padding:10,borderWidth:1,borderColor:t.line}}>
          <View style={{flex:1}}>
            <T style={{fontSize:12,fontWeight:'700',color:t.ink}}>{copy(lang,'hideTitleOnCover')}</T>
            <T style={{fontSize:10,color:t.muted,marginTop:2}}>{copy(lang,'hideTitleHint')}</T>
          </View>
          <View style={{width:44,height:26,borderRadius:13,backgroundColor:hideTitle?t.primary:t.line,alignItems:'center',justifyContent:'center',padding:2}}>
            <View style={{width:22,height:22,borderRadius:11,backgroundColor:'#fff',alignItems:'center',justifyContent:'center',elevation:2,transform:[{translateX:hideTitle?18:0}]}}/>
          </View>
        </Pressable>}
      </View>
      <View style={{marginBottom:16}}>
        <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
          <T style={{fontSize:11,fontWeight:'700',color:t.muted}}>{copy(lang,'firstChapter')}</T>
        </View>
        <TextInput value={chTitle} onChangeText={setChTitle} placeholder={copy(lang,'chapterTitle')} placeholderTextColor={t.muted+'88'} style={{color:t.ink,fontSize:14,fontWeight:'700',backgroundColor:t.card,borderWidth:1,borderColor:t.line,borderRadius:10,padding:10,marginBottom:8,fontFamily:GF()}}/>
        <View style={{backgroundColor:t.card,borderWidth:1,borderColor:chBody.length>0?t.primary:t.line,borderRadius:12,overflow:'hidden'}}>
          <TextInput value={chBody} onChangeText={setChBody} multiline placeholder={copy(lang,'chapterContentHint')} placeholderTextColor={t.muted+'88'} style={{color:t.ink,fontSize:14,minHeight:200,maxHeight:400,textAlignVertical:'top',padding:12,fontFamily:GF(),lineHeight:22}}/>
          {chBody.length>0&&<View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-end',paddingHorizontal:12,paddingBottom:8}}>
            <T style={{fontSize:10,color:t.muted}}>{chBody.length} {'\u0985\u0995\u09CD\u09B7\u09B0'}</T>
          </View>}
        </View>
      </View>
      <View style={{marginBottom:16}}>
        <T style={{fontSize:11,fontWeight:'700',color:t.muted,marginBottom:6}}>{copy(lang,'selectCategory')}</T>
        <Pressable onPress={()=>setCatOpen(!catOpen)} style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderWidth:1,borderColor:catOpen?t.primary:t.line,borderRadius:10,padding:12,backgroundColor:t.card}}>
          <T style={{fontSize:13,fontWeight:category?'700':'500',color:category?t.ink:t.muted}}>{category||copy(lang,'selectCategory')}</T>
          <Feather name={catOpen?'chevron-up':'chevron-down'} size={16} color={t.muted}/>
        </Pressable>
        {catOpen&&<View style={{borderWidth:1,borderColor:t.line,borderRadius:10,backgroundColor:t.card,maxHeight:160,overflow:'hidden',marginTop:4}}>
          <ScrollView nestedScrollEnabled style={{maxHeight:140}}>
            {localCats.map(c=><Pressable key={c} onPress={()=>{setCategory(c);setCatOpen(false)}} style={{paddingHorizontal:12,paddingVertical:9,borderBottomWidth:1,borderBottomColor:t.line,flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
              <T style={{fontSize:13,fontWeight:category===c?'800':'500',color:category===c?t.primary:t.ink}}>{c}</T>
              {category===c&&<Feather name="check" size={14} color={t.primary}/>}
            </Pressable>)}
          </ScrollView>
          <Pressable onPress={()=>{setShowNewCat(true);setCatOpen(false)}} style={{padding:10,backgroundColor:t.tint,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:5}}>
            <Feather name="plus" size={14} color={t.primary}/>
            <T style={{fontSize:11,fontWeight:'800',color:t.primary}}>{'\u09A8\u09A4\u09C1\u09A8 \u09AC\u09BF\u09AD\u09BE\u0997'}</T>
          </Pressable>
        </View>}
        {showNewCat&&<View style={{borderRadius:10,borderWidth:1,borderColor:t.primary,padding:10,marginTop:4,backgroundColor:t.card}}>
          <TextInput value={newCatName} onChangeText={setNewCatName} placeholder={'\u09AC\u09BF\u09AD\u09BE\u0997\u09C7\u09B0 \u09A8\u09BE\u09AE...'} placeholderTextColor={t.muted} style={{color:t.ink,fontSize:12,backgroundColor:t.bg,borderWidth:1,borderColor:t.line,borderRadius:8,padding:8,marginBottom:6,fontFamily:GF()}}/>
          <View style={{flexDirection:'row',gap:6}}>
            <Pressable onPress={()=>{setShowNewCat(false);setNewCatName('')}} style={{flex:1,alignItems:'center',paddingVertical:7,borderRadius:8,backgroundColor:t.tint}}>
              <T style={{fontSize:11,fontWeight:'700',color:t.muted}}>{copy(lang,'cancel')}</T>
            </Pressable>
            <Pressable disabled={!newCatName.trim()} onPress={addNewCat} style={{flex:1,alignItems:'center',paddingVertical:7,borderRadius:8,backgroundColor:newCatName.trim()?t.primary:t.tint,opacity:newCatName.trim()?1:0.5}}>
              <T style={{fontSize:11,fontWeight:'700',color:newCatName.trim()?'#fff':t.muted}}>{copy(lang,'create')}</T>
            </Pressable>
          </View>
        </View>}
      </View>
      <Pressable onPress={()=>setShowPreview(!showPreview)} style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,backgroundColor:t.tint,borderRadius:10,paddingVertical:10,marginBottom:showPreview?10:0,borderWidth:1,borderColor:t.line}}>
        <Feather name={showPreview?'chevron-up':'eye'} size={16} color={t.primary}/>
        <T style={{fontSize:12,fontWeight:'800',color:t.primary}}>{showPreview?'\u09AA\u09CD\u09B0\u09BF\u09AD\u09BF\u09A8 \u09AC\u09A8\u09CD\u09A7':copy(lang,'previewHome')}</T>
      </Pressable>
      {showPreview&&<View style={{width:130,alignSelf:'center',marginTop:10}}>
        <View style={{position:'relative'}}>
          <View style={{width:124,height:169,borderRadius:9,backgroundColor:'#123E39',overflow:'hidden',padding:(hideTitle&&coverPreview)?0:11,justifyContent:(hideTitle&&coverPreview)?'flex-start':'flex-end'}}>
            {coverPreview?<Image source={{uri:coverPreview}} style={{position:'absolute',top:0,left:0,right:0,bottom:0,borderRadius:9}} resizeMode="cover"/>:null}
            {!hideTitle&&coverPreview&&<View style={{position:'absolute',top:0,left:0,right:0,bottom:0,borderRadius:9,backgroundColor:'rgba(0,0,0,0.15)'}}/>}
            {!(hideTitle&&coverPreview)&&<Feather name="book-open" size={20} color="#F5C660"/>}
            {!hideTitle&&<T numberOfLines={3} style={{color:'#fff',fontWeight:'900',fontSize:14,lineHeight:18}}>{title||'...'}</T>}
            {!hideTitle&&<View style={{height:2,width:24,backgroundColor:'#F5C660',marginVertical:7}}/>}
            {!(hideTitle&&coverPreview)&&<T style={{fontSize:8,color:'#FFFFFFAA'}}>{'\u09B2\u09C7\u0996\u0995'}</T>}
          </View>
          {displayStatus==='ongoing'?<View style={{position:'absolute',top:8,left:8,borderRadius:7,paddingVertical:3,paddingHorizontal:7,backgroundColor:'#10B981'}}><T style={{fontSize:9,fontWeight:'900',color:'#fff'}}>{copy(lang,'statusOngoing')}</T></View>:
          displayStatus==='complete'?<View style={{position:'absolute',top:8,left:8,borderRadius:7,paddingVertical:3,paddingHorizontal:7,backgroundColor:'#8B5CF6'}}><T style={{fontSize:9,fontWeight:'900',color:'#fff'}}>{copy(lang,'statusComplete')}</T></View>:null}
        </View>
        <T numberOfLines={2} style={{fontSize:14,fontWeight:'800',color:t.ink,lineHeight:20,marginTop:10}}>{title||'...'}</T>
        <T numberOfLines={1} style={{color:t.muted,fontSize:11}}>{'\u09B2\u09C7\u0996\u0995'}</T>
      </View>}
    </ScrollView>
  </View>;
}


function TermsScreen({theme:t,lang,onBack}:{theme:Theme;lang:Language;onBack:()=>void}){
  const insets=useSafeAreaInsets();
  const[tab,setTab]=useState<'terms'|'privacy'|'content'>('terms');
  const tabs={terms:copy(lang,'termsOfService'),privacy:copy(lang,'privacyPolicy'),content:copy(lang,'contentPolicy')} as const;
  const content={
    terms:{title:copy(lang,'termsOfService'),sections:[copy(lang,'termsIntro'),copy(lang,'termsAccept'),copy(lang,'termsUserContent'),copy(lang,'termsConduct'),copy(lang,'termsTermination')]},
    privacy:{title:copy(lang,'privacyPolicy'),sections:[copy(lang,'privacyIntro'),copy(lang,'privacyData'),copy(lang,'privacyUsage'),copy(lang,'privacySharing'),copy(lang,'privacySecurity'),copy(lang,'privacyChanges')]},
    content:{title:copy(lang,'contentPolicy'),sections:[copy(lang,'contentIntro'),copy(lang,'contentOwnership'),copy(lang,'contentModeration'),copy(lang,'contentReporting'),copy(lang,'contentMonetization')]}
  } as const;
  return <View style={{flex:1,backgroundColor:t.bg}}>
    <View style={{flexDirection:'row',alignItems:'center',paddingHorizontal:14,paddingTop:insets.top+8,paddingBottom:10,backgroundColor:t.card,borderBottomWidth:1,borderBottomColor:t.line}}>
      <Pressable onPress={onBack} hitSlop={10}><Feather name="arrow-left" size={22} color={t.ink}/></Pressable>
      <T style={{fontSize:16,fontWeight:'900',color:t.ink,marginLeft:14}}>{copy(lang,'termsOfService')}</T>
    </View>
    <View style={{flexDirection:'row',backgroundColor:t.card,borderBottomWidth:1,borderBottomColor:t.line}}>
      {(['terms','privacy','content'] as const).map(k=><Pressable key={k} onPress={()=>setTab(k)} style={{flex:1,paddingVertical:10,alignItems:'center',borderBottomWidth:2,borderBottomColor:tab===k?t.primary:'transparent'}}><T style={{fontSize:11,fontWeight:tab===k?'800':'600',color:tab===k?t.primary:t.muted}}>{tabs[k]}</T></Pressable>)}
    </View>
    <ScrollView contentContainerStyle={{padding:16,paddingBottom:40}} showsVerticalScrollIndicator={false}>
      <View style={{backgroundColor:t.card,borderRadius:12,padding:16,borderWidth:1,borderColor:t.line}}>
        <T style={{fontSize:14,fontWeight:'800',color:t.ink,marginBottom:4}}>{content[tab].title}</T>
        <T style={{fontSize:10,color:t.muted,marginBottom:12}}>{copy(lang,'lastUpdated')}: 2026-08-31</T>
        {content[tab].sections.map((s,i)=><T key={i} style={{fontSize:12,color:t.ink,lineHeight:20,marginBottom:10}}>{s}</T>)}
      </View>
      <View style={{backgroundColor:t.card,borderRadius:12,padding:14,borderWidth:1,borderColor:t.line,marginTop:12}}>
        <View style={{flexDirection:'row',alignItems:'center',gap:6,marginBottom:6}}>
          <Feather name="mail" size={14} color={t.primary}/>
          <T style={{fontSize:12,fontWeight:'700',color:t.ink}}>{copy(lang,'contactUs')}</T>
        </View>
        <T style={{fontSize:11,color:t.muted}}>{copy(lang,'contactEmail')}</T>
        <T style={{fontSize:11,color:t.muted,marginTop:4}}>{copy(lang,'contactResponse')}</T>
      </View>
    </ScrollView>
  </View>;
}

function AboutAppScreen({theme:t,lang,onBack}:{theme:Theme;lang:Language;onBack:()=>void}){
  const insets=useSafeAreaInsets();
  const[apiData,setApiData]=useState<{title:string;subtitle:string;description:string;features:string[];version:string;developer:string}|null>(null);
  useEffect(()=>{fetchAbout().then(d=>{if(d&&d.title)setApiData(d)}).catch(()=>{})},[]);
  const defaults:Record<string,{title:string;subtitle:string;desc:string;features:{icon:any;color:string;text:string}[]}>={
    bn:{title:'Lekhoni Kahini',subtitle:'বাংলা সাহিত্য ও উপন্যাসের এক অনন্য পাঠভুবন',desc:'এখানে পাবেন নতুন ও জনপ্রিয় লেখকদের অসংখ্য উপন্যাস, ছোটগল্প, কবিতা ও বিভিন্ন সাহিত্যকর্ম। নিজের পছন্দের গল্প খুঁজে পড়ুন, প্রিয় লেখকদের অনুসরণ করুন এবং বাংলা সাহিত্যের গল্পে হারিয়ে যান।',features:[{icon:'book-open',color:'#10B981',text:'হাজার হাজার বাংলা গল্প ও উপন্যাস'},{icon:'users',color:'#3B82F6',text:'নতুন ও জনপ্রিয় লেখকদের সৃজনশীল সাহিত্য'},{icon:'wifi-off',color:'#8B5CF6',text:'অফলাইনে পড়ার সুবিধা'},{icon:'feather',color:'#F59E0B',text:'নিজের গল্প লেখা ও প্রকাশের সুযোগ'},{icon:'dollar-sign',color:'#EF4444',text:'গল্প লিখে আয়ের সুযোগ পান'},{icon:'shield',color:'#06B6D4',text:'নিরাপদ ও ব্যবহারকারী-বান্ধব অভিজ্ঞতা'}]},
    en:{title:'Lekhoni Kahini',subtitle:'Your gateway to Bengali literature & novels',desc:'Discover thousands of novels, short stories, poems and literary works from popular Bengali authors. Find your favorite stories, follow beloved writers and immerse yourself in Bengali literature.',features:[{icon:'book-open',color:'#10B981',text:'Thousands of Bengali stories & novels'},{icon:'users',color:'#3B82F6',text:'Creative works from popular authors'},{icon:'wifi-off',color:'#8B5CF6',text:'Read offline anytime'},{icon:'feather',color:'#F59E0B',text:'Write & publish your own stories'},{icon:'dollar-sign',color:'#EF4444',text:'Earn money by writing stories'},{icon:'shield',color:'#06B6D4',text:'Safe & user-friendly experience'}]},
    hi:{title:'Lekhoni Kahini',subtitle:'बंगाली साहित्य और उपन्यासों का अनोखा मंच',desc:'यहाँ पाएं नए और लोकप्रिय लेखकों की असंख्य कहानियाँ, लघु कथाएँ, कविताएँ और साहित्यिक कृतियाँ। अपनी पसंदीदा कहानियाँ खोजें, प्रिय लेखकों का अनुसरण करें और बंगाली साहित्य में खो जाएं।',features:[{icon:'book-open',color:'#10B981',text:'हज़ारों बंगाली कहानियाँ और उपन्यास'},{icon:'users',color:'#3B82F6',text:'लोकप्रिय लेखकों की रचनाएँ'},{icon:'wifi-off',color:'#8B5CF6',text:'कभी भी ऑफ़लाइन पढ़ें'},{icon:'feather',color:'#F59E0B',text:'अपनी कहानियाँ लिखें और प्रकाशित करें'},{icon:'dollar-sign',color:'#EF4444',text:'कहानी लिखकर कमाएं'},{icon:'shield',color:'#06B6D4',text:'सुरक्षित और उपयोगकर्ता-अनुकूल'}]}
  };
  const d=defaults[lang]||defaults.bn;
  const finalTitle=apiData?.title||d.title;
  const finalSubtitle=apiData?.subtitle||d.subtitle;
  const finalDesc=apiData?.description||d.desc;
  const finalFeatures=(apiData?.features&&apiData.features.length>0?apiData.features:d.features.map(f=>f.text));
  return <View style={{flex:1,backgroundColor:t.bg}}>
    <View style={{flexDirection:'row',alignItems:'center',paddingHorizontal:14,paddingTop:insets.top+8,paddingBottom:10,backgroundColor:t.card,borderBottomWidth:1,borderBottomColor:t.line}}>
      <Pressable onPress={onBack} hitSlop={10}><Feather name="arrow-left" size={22} color={t.ink}/></Pressable>
      <T style={{fontSize:16,fontWeight:'900',color:t.ink,marginLeft:14}}>{copy(lang,'aboutApp')}</T>
    </View>
    <ScrollView contentContainerStyle={{paddingBottom:40}} showsVerticalScrollIndicator={false}>
      <View style={{backgroundColor:t.primary,paddingTop:28,paddingBottom:32,alignItems:'center',position:'relative',overflow:'hidden'}}>
        <Svg width={140} height={140} style={{position:'absolute',top:-30,right:-40,opacity:0.07}}>
          <Circle cx={70} cy={70} r={60} fill="#fff"/>
          {[0,45,90,135,180,225,270,315].map((r,i)=><Ellipse key={i} cx={70} cy={70} rx={14} ry={42} fill="#fff" transform={`rotate(${r} 70 70)`}/>)}
        </Svg>
        <Svg width={100} height={100} style={{position:'absolute',bottom:-20,left:-25,opacity:0.05}}>
          {[0,60,120,180,240,300].map((r,i)=><Ellipse key={i} cx={50} cy={50} rx={10} ry={35} fill="#fff" transform={`rotate(${r} 50 50)`}/>)}
        </Svg>
        <View style={{width:56,height:56,borderRadius:14,backgroundColor:'rgba(255,255,255,0.15)',alignItems:'center',justifyContent:'center',marginBottom:10,borderWidth:1.5,borderColor:'rgba(255,255,255,0.2)'}}>
          <Feather name="book-open" size={26} color="#fff"/>
        </View>
        <T style={{fontSize:18,fontWeight:'900',color:'#fff',marginBottom:4}}>{finalTitle}</T>
        <T style={{fontSize:11,color:'rgba(255,255,255,0.8)',textAlign:'center',maxWidth:260,lineHeight:16}}>{finalSubtitle}</T>
      </View>
      <View style={{paddingHorizontal:16,marginTop:-14}}>
        <View style={{backgroundColor:t.card,borderRadius:12,padding:14,borderWidth:1,borderColor:t.line}}>
          <View style={{flexDirection:'row',alignItems:'center',gap:6,marginBottom:8}}>
            <View style={{width:22,height:22,borderRadius:6,backgroundColor:t.primary+'18',alignItems:'center',justifyContent:'center'}}>
              <Feather name="file-text" size={11} color={t.primary}/>
            </View>
            <T style={{fontSize:12,fontWeight:'800',color:t.ink}}>{copy(lang,'aboutApp')}</T>
          </View>
          <T style={{fontSize:11,color:t.muted,lineHeight:18}}>{finalDesc}</T>
        </View>
      </View>
      <View style={{paddingHorizontal:16,marginTop:12}}>
        <T style={{fontSize:12,fontWeight:'800',color:t.ink,marginBottom:8,marginLeft:2}}>{lang==='bn'?'বৈশিষ্ট্য':lang==='hi'?'विशेषताएँ':'Features'}</T>
        {finalFeatures.map((f,i)=>{
          const colors=['#10B981','#3B82F6','#8B5CF6','#F59E0B','#EF4444','#06B6D4'];
          const icons=['book-open','users','wifi-off','feather','dollar-sign','shield'];
          const c=colors[i%colors.length];
          return <View key={i} style={{flexDirection:'row',alignItems:'center',gap:10,backgroundColor:t.card,borderRadius:10,padding:10,marginBottom:6,borderWidth:1,borderColor:t.line}}>
            <View style={{width:28,height:28,borderRadius:8,backgroundColor:c+'18',alignItems:'center',justifyContent:'center'}}>
              <Feather name={icons[i%icons.length]as any} size={13} color={c}/>
            </View>
            <T style={{fontSize:11,fontWeight:'600',color:t.ink,flex:1}}>{f}</T>
          </View>
        })}
      </View>
      <View style={{paddingHorizontal:16,marginTop:12}}>
        <View style={{backgroundColor:'#FEF3C7',borderRadius:12,padding:12,borderWidth:1,borderColor:'#F59E0B'}}>
          <View style={{flexDirection:'row',alignItems:'center',gap:6,marginBottom:6}}>
            <Feather name="zap" size={14} color="#D97706"/>
            <T style={{fontSize:11,fontWeight:'800',color:'#92400E'}}>{lang==='bn'?'আয়ের সুযোগ':lang==='hi'?'कमाई का अवसर':'Earning Opportunity'}</T>
          </View>
          <T style={{fontSize:10,color:'#78350F',lineHeight:16}}>{lang==='bn'?'আপনি আপনার গল্প লিখে এবং এই অ্যাপে প্রকাশ করে আয় করতে পারবেন। আপনার গল্প যত বেশি পড়া হবে, তত বেশি আয় হবে।':lang==='hi'?'आप अपनी कहानी लिखकर और इस ऐप पर प्रकाशित करके कमा सकते हैं। जितनी ज़्यादा आपकी कहानी पढ़ी जाएगी, उतनी ज़्यादा कमाई होगी।':'Write stories and publish on this app to earn. The more your stories are read, the more you earn.'}</T>
        </View>
      </View>
      <View style={{paddingHorizontal:16,marginTop:16,alignItems:'center'}}>
        <View style={{flexDirection:'row',alignItems:'center',gap:4,marginBottom:4}}>
          <Feather name="heart" size={11} color="#EF4444"/>
          <T style={{fontSize:10,color:t.muted}}>{apiData?.developer||'Kawsar Hosen'}</T>
        </View>
         <T style={{fontSize:9,color:t.muted}}>Version {apiData?.version||'1.1.0'}</T>
      </View>
    </ScrollView>
  </View>;
}

function EditStoryScreen({token,theme:t,lang,storyId,initialTitle,initialDesc,initialCover,initialWriterStatus,onBack,onSaved}:{token:string;theme:Theme;lang:Language;storyId:string;initialTitle:string;initialDesc:string;initialCover:string|null;initialWriterStatus:string;onBack:()=>void;onSaved:()=>void}){
  const insets=useSafeAreaInsets();
  const[title,setTitle]=useState(initialTitle);
  const[desc,setDesc]=useState(initialDesc);
  const[cover,setCover]=useState(initialCover||'');
  const[coverPreview,setCoverPreview]=useState(initialCover||'');
  const[writerStatus,setWriterStatus]=useState(initialWriterStatus);
  const[saving,setSaving]=useState(false);
  const[saved,setSaved]=useState(false);
  const[uploadingImg,setUploadingImg]=useState(false);
  const pickCover=async()=>{setUploadingImg(true);const url=await pickAndResizeImage('cover');if(url){setCover(url);setCoverPreview(url)}setUploadingImg(false)};
  const save=async()=>{if(!title.trim())return;setSaving(true);try{await updateWriterStory(token,storyId,{title:title.trim(),description:desc.trim(),cover_url:cover||undefined,writer_status:writerStatus||undefined});onSaved();setSaved(true);setTimeout(()=>onBack(),1200)}catch(e){}finally{setSaving(false)}};
  return <View style={{flex:1,backgroundColor:t.bg}}>
    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:14,paddingTop:insets.top+8,paddingBottom:10,backgroundColor:t.card,borderBottomWidth:1,borderBottomColor:t.line}}>
      <Pressable onPress={onBack} style={{flexDirection:'row',alignItems:'center',gap:4}}>
        <Feather name="arrow-left" size={18} color={t.primary}/>
        <T style={{fontSize:13,fontWeight:'700',color:t.primary}}>{copy(lang,'cancel')}</T>
      </Pressable>
      <T style={{fontSize:15,fontWeight:'900',color:t.ink}}>সম্পাদনা</T>
      <Pressable onPress={save} disabled={saving||!title.trim()} style={{backgroundColor:t.primary,borderRadius:8,paddingHorizontal:12,paddingVertical:6,opacity:saving||!title.trim()?0.5:1}}>
        {saving?<ActivityIndicator color="#fff" size="small"/>:<T style={{color:'#fff',fontWeight:'800',fontSize:12}}>{copy(lang,'save')}</T>}
      </Pressable>
    </View>
    <ScrollView contentContainerStyle={{padding:16,paddingBottom:40}} keyboardShouldPersistTaps="handled">
      {saved&&<View style={{backgroundColor:'#10B981'+'18',borderRadius:10,padding:12,marginBottom:14,flexDirection:'row',alignItems:'center',gap:8}}>
        <Feather name="check-circle" size={18} color="#10B981"/>
        <T style={{fontSize:13,fontWeight:'700',color:'#10B981'}}>সংরক্ষিত হয়েছে</T>
      </View>}
      <View style={{backgroundColor:t.primary+'12',borderRadius:10,padding:12,marginBottom:16,flexDirection:'row',alignItems:'flex-start',gap:8}}>
        <Feather name="info" size={16} color={t.primary} style={{marginTop:2}}/>
        <T style={{fontSize:12,color:t.ink,lineHeight:20,flex:1}}>আপনি যেকোনো সময় এই গল্পটি পুনরায় সম্পাদনা করতে পারবেন। পরিবর্তন করার পর "সংরক্ষণ" চাপুন।</T>
      </View>
      <T style={{fontSize:11,fontWeight:'700',color:t.muted,marginBottom:6}}>কভার ছবি</T>
      <Pressable onPress={pickCover} disabled={uploadingImg} style={{borderRadius:12,borderWidth:1.5,borderColor:t.line,borderStyle:'dashed',overflow:'hidden',marginBottom:16}}>
        {uploadingImg?<View style={{height:140,alignItems:'center',justifyContent:'center',backgroundColor:t.card}}><ActivityIndicator size="small" color={t.primary}/></View>:
        coverPreview?<View style={{height:140,backgroundColor:t.card,alignItems:'center',justifyContent:'center'}}><Image source={{uri:coverPreview}} style={{width:100,height:130,borderRadius:10}} resizeMode="cover"/><View style={{flexDirection:'row',alignItems:'center',gap:5,marginTop:8}}><Feather name="refresh-cw" size={12} color={t.muted}/><T style={{fontSize:11,color:t.muted,fontWeight:'600'}}>{copy(lang,'changePhoto')}</T></View></View>:
        <View style={{height:140,backgroundColor:t.card,alignItems:'center',justifyContent:'center'}}><Feather name="camera" size={28} color={t.muted}/><T style={{fontSize:12,color:t.muted,marginTop:6,fontWeight:'600'}}>{copy(lang,'addCover')}</T></View>}
      </Pressable>
      <T style={{fontSize:11,fontWeight:'700',color:t.muted,marginBottom:4}}>শিরোনাম</T>
      <TextInput value={title} onChangeText={setTitle} placeholder="গল্পের শিরোনাম" placeholderTextColor={t.muted} style={{color:t.ink,fontSize:16,fontWeight:'700',backgroundColor:t.card,borderWidth:1,borderColor:t.line,borderRadius:10,padding:12,marginBottom:16,fontFamily:GF()}}/>
      <T style={{fontSize:11,fontWeight:'700',color:t.muted,marginBottom:4}}>বিবরণ</T>
      <TextInput value={desc} onChangeText={setDesc} multiline placeholder="বিবরণ লিখুন..." placeholderTextColor={t.muted} style={{color:t.ink,fontSize:13,backgroundColor:t.card,borderWidth:1,borderColor:t.line,borderRadius:10,padding:12,minHeight:120,textAlignVertical:'top',fontFamily:GF(),lineHeight:20,marginBottom:16}}/>
      <T style={{fontSize:11,fontWeight:'700',color:t.muted,marginBottom:6}}>গল্পের ধরন</T>
      <View style={{flexDirection:'row',gap:8,marginBottom:20}}>
        {([['ongoing','ধারাবাহিক','ongoing'],['complete','সম্পূর','complete']] as const).map(([k,l,v])=>(
          <Pressable key={k} onPress={()=>setWriterStatus(writerStatus===v?'':v)} style={{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,backgroundColor:writerStatus===v?t.primary:t.card,borderWidth:1.5,borderColor:writerStatus===v?t.primary:t.line,borderRadius:10,paddingVertical:12}}>
            <View style={{width:18,height:18,borderRadius:9,borderWidth:2,borderColor:writerStatus===v?'#fff':t.muted,alignItems:'center',justifyContent:'center'}}>
              {writerStatus===v&&<View style={{width:10,height:10,borderRadius:5,backgroundColor:'#fff'}}/>}
            </View>
            <T style={{fontSize:14,fontWeight:'800',color:writerStatus===v?'#fff':t.ink}}>{l}</T>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  </View>;
}

function WriterStories({token,theme:t,lang,categories,setScreen,onRefresh}:{token:string;theme:Theme;lang:Language;categories:string[];setScreen:(s:Screen)=>void;onRefresh?:()=>void}){
  const insets=useSafeAreaInsets();
  const[stories,setStories]=useState<any[]>([]);
  const[loading,setLoading]=useState(true);
  const[filter,setFilter]=useState<'all'|'published'|'draft'|'pending'|'rejected'>('all');
  const[expanded,setExpanded]=useState<string|null>(null);
  const[chapters,setChapters]=useState<any[]>([]);
  const[chTitle,setChTitle]=useState('');
  const[chBody,setChBody]=useState('');
  const[chSaving,setChSaving]=useState(false);
  const[storyStatuses,setStoryStatuses]=useState<Record<string,string>>({});
  const[writerStatuses,setWriterStatuses]=useState<Record<string,string>>({});
  const[deleteId,setDeleteId]=useState<string|null>(null);
  const load=()=>{fetchWriterStories(token).then(s=>{setStories(s||[]);const m:Record<string,string>={};const w:Record<string,string>={};(s||[]).forEach((x:any)=>{if(x.display_status)m[x.id]=x.display_status;if(x.writer_status)w[x.id]=x.writer_status});setStoryStatuses(m);setWriterStatuses(w)}).finally(()=>setLoading(false))};
  useEffect(()=>{load()},[token]);
  const filtered=filter==='all'?stories:stories.filter(s=>s.status===filter);
  const statusColor=(s:string)=>s==='published'?'#10B981':s==='pending'?'#F59E0B':s==='rejected'?'#EF4444':'#9CA3AF';
  const toggleExpand=async(id:string)=>{
    if(expanded===id){setExpanded(null);return}
    setExpanded(id);setChapters([]);
    try{const detail=await fetchWriterStoryDetail(token,id);if(detail?.chapters)setChapters(detail.chapters)}catch{}
  };
  const addChapter=async(storyId:string)=>{
    if(!chTitle.trim())return;setChSaving(true);
    const r=await createStoryChapter(token,storyId,chTitle.trim(),chBody);
    if(r){setChapters(c=>[...c,r]);setChTitle('');setChBody('')}
    setChSaving(false);
  };
  const removeChapter=async(storyId:string,chapterId:string)=>{
    await deleteStoryChapter(token,storyId,chapterId);
    setChapters(c=>c.filter(x=>x.id!==chapterId));
  };
  const handleSubmit=async(id:string)=>{await submitStoryForReview(token,id);load()};
  const handleDelete=async(id:string)=>{setDeleteId(id)};
  const confirmDelete=async()=>{if(deleteId){await deleteWriterStory(token,deleteId);setDeleteId(null);load();onRefresh?.()}};
  const toggleDisplayStatus=async(id:string,status:string)=>{const newStatus=storyStatuses[id]===status?'':status;setStoryStatuses(s=>({...s,[id]:newStatus}));await updateWriterStory(token,id,{display_status:newStatus});setStories(s=>s.map(x=>x.id===id?{...x,display_status:newStatus}:x))};
  const toggleWriterStatus=async(id:string,status:string)=>{const newStatus=writerStatuses[id]===status?'':status;setWriterStatuses(s=>({...s,[id]:newStatus}));await updateWriterStory(token,id,{writer_status:newStatus});setStories(s=>s.map(x=>x.id===id?{...x,writer_status:newStatus}:x))};
  const startEdit=(s:any)=>{setScreen({type:'editStory',id:s.id,title:s.title,desc:s.description||'',coverUrl:s.cover_url||null,writerStatus:s.writer_status||''})};
  return <View style={{flex:1}}>
    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
      <T style={{fontSize:16,fontWeight:'900',color:t.ink}}>{copy(lang,'myStories')} ({stories.length})</T>
      <Pressable onPress={()=>setScreen({type:'newStory'})} style={{backgroundColor:t.primary,borderRadius:10,paddingHorizontal:12,paddingVertical:7,flexDirection:'row',alignItems:'center',gap:5}}>
        <Feather name="plus" size={14} color="#fff"/>
        <T style={{color:'#fff',fontWeight:'800',fontSize:12}}>{copy(lang,'newStory')}</T>
      </Pressable>
    </View>
    <View style={{flexDirection:'row',gap:5,marginBottom:14}}>
      {(['all','published','draft','pending','rejected'] as const).map(f=><Pressable key={f} onPress={()=>setFilter(f)} style={{paddingHorizontal:10,paddingVertical:5,borderRadius:8,backgroundColor:filter===f?t.primary:t.card,borderWidth:1,borderColor:filter===f?t.primary:t.line}}>
        <T style={{fontSize:11,fontWeight:'700',color:filter===f?'#fff':t.muted}}>{copy(lang,f)}</T>
      </Pressable>)}
    </View>
    {loading?<View style={{alignItems:'center',paddingVertical:40}}><ActivityIndicator color={t.primary}/></View>:
    filtered.length===0?<View style={{alignItems:'center',paddingVertical:40}}><Feather name="book" size={28} color={t.muted}/><T style={{fontSize:13,color:t.muted,marginTop:8}}>{copy(lang,'noStories')}</T></View>:
    filtered.map(s=><View key={s.id} style={{backgroundColor:t.card,borderRadius:14,padding:14,marginBottom:8,borderWidth:1,borderColor:t.line}}>
      <View style={{flexDirection:'row',alignItems:'center',marginBottom:8}}>
        {s.cover_url?<Image source={{uri:s.cover_url}} style={{width:44,height:34,borderRadius:6,marginRight:10}}/>:
        <View style={{width:44,height:34,borderRadius:6,backgroundColor:t.tint,alignItems:'center',justifyContent:'center',marginRight:10}}><Feather name="book-open" size={14} color={t.muted}/></View>}
        <View style={{width:8,height:8,borderRadius:4,backgroundColor:statusColor(s.status),marginRight:8}}/>
        <T numberOfLines={1} style={{flex:1,fontSize:14,fontWeight:'800',color:t.ink}}>{s.title}</T>
        <View style={{paddingHorizontal:8,paddingVertical:3,borderRadius:6,backgroundColor:statusColor(s.status)+'18'}}>
          <T style={{fontSize:10,fontWeight:'700',color:statusColor(s.status)}}>{copy(lang,s.status)}</T>
        </View>
      </View>
      {s.description?<T numberOfLines={2} style={{fontSize:12,color:t.muted,marginBottom:8}}>{s.description}</T>:null}
      <View style={{flexDirection:'row',gap:6}}>
        {s.status==='draft'&&<Pressable onPress={()=>handleSubmit(s.id)} style={{flex:1,backgroundColor:'#FEF3C7',borderRadius:8,paddingVertical:7,alignItems:'center'}}>
          <T style={{fontSize:11,fontWeight:'700',color:'#D97706'}}>{copy(lang,'submitReview')}</T>
        </Pressable>}
        {s.status==='rejected'&&<Pressable onPress={()=>handleSubmit(s.id)} style={{flex:1,backgroundColor:'#FEE2E2',borderRadius:8,paddingVertical:7,alignItems:'center'}}>
          <T style={{fontSize:11,fontWeight:'700',color:'#EF4444'}}>{copy(lang,'submitReview')}</T>
        </Pressable>}
        <Pressable onPress={()=>toggleExpand(s.id)} style={{width:32,height:32,borderRadius:8,backgroundColor:t.tint,alignItems:'center',justifyContent:'center'}}>
          <Feather name="book-open" size={14} color={expanded===s.id?t.primary:t.muted}/>
        </Pressable>
        <Pressable onPress={()=>startEdit(s)} style={{width:32,height:32,borderRadius:8,backgroundColor:t.tint,alignItems:'center',justifyContent:'center'}}>
          <Feather name="edit-2" size={14} color={t.muted}/>
        </Pressable>
        <Pressable onPress={()=>toggleDisplayStatus(s.id,'ongoing')} style={{width:32,height:32,borderRadius:8,backgroundColor:(storyStatuses[s.id]||s.display_status)==='ongoing'?'#10B981':t.tint,alignItems:'center',justifyContent:'center'}}>
          <T style={{fontSize:9,fontWeight:'800',color:(storyStatuses[s.id]||s.display_status)==='ongoing'?'#fff':t.muted}}>চলমান</T>
        </Pressable>
        <Pressable onPress={()=>toggleDisplayStatus(s.id,'new')} style={{width:32,height:32,borderRadius:8,backgroundColor:(storyStatuses[s.id]||s.display_status)==='new'?'#8B5CF6':t.tint,alignItems:'center',justifyContent:'center'}}>
          <T style={{fontSize:9,fontWeight:'800',color:(storyStatuses[s.id]||s.display_status)==='new'?'#fff':t.muted}}>নতুন</T>
        </Pressable>
        <Pressable onPress={()=>handleDelete(s.id)} style={{width:32,height:32,borderRadius:8,backgroundColor:t.tint,alignItems:'center',justifyContent:'center'}}>
          <Feather name="trash-2" size={14} color={t.muted}/>
        </Pressable>
      </View>
      {s.review_note&&<View style={{marginTop:8,backgroundColor:'#FEF2F2',borderRadius:8,padding:8}}>
        <T style={{fontSize:11,color:'#991B1B',fontWeight:'600'}}>{copy(lang,'reviewNote')}: {s.review_note}</T>
      </View>}
      {expanded===s.id&&<View style={{marginTop:10,borderTopWidth:1,borderTopColor:t.line,paddingTop:10}}>
        <T style={{fontSize:12,fontWeight:'800',color:t.ink,marginBottom:6}}>{copy(lang,'chapters')} ({chapters.length})</T>
        {chapters.map((ch,i)=><View key={ch.id} style={{flexDirection:'row',alignItems:'center',backgroundColor:t.bg,borderRadius:8,padding:8,marginBottom:4}}>
          <View style={{width:22,height:22,borderRadius:11,backgroundColor:t.tint,alignItems:'center',justifyContent:'center',marginRight:8}}>
            <T style={{fontSize:10,fontWeight:'800',color:t.primary}}>{i+1}</T>
          </View>
          <T numberOfLines={1} style={{flex:1,fontSize:12,fontWeight:'600',color:t.ink}}>{ch.title}</T>
          <Pressable onPress={()=>removeChapter(s.id,ch.id)}><Feather name="x" size={15} color={t.muted}/></Pressable>
        </View>)}
        <TextInput value={chTitle} onChangeText={setChTitle} placeholder={copy(lang,'chapterTitle')} placeholderTextColor={t.muted} style={{color:t.ink,fontSize:13,fontWeight:'700',marginTop:8,borderBottomWidth:1,borderBottomColor:t.line,paddingBottom:6,fontFamily:GF()}}/>
        <TextInput value={chBody} onChangeText={setChBody} multiline placeholder={copy(lang,'chapterBody')} placeholderTextColor={t.muted} style={{color:t.ink,fontSize:12,marginTop:8,minHeight:60,textAlignVertical:'top',fontFamily:GF()}}/>
        <Pressable disabled={chSaving||!chTitle.trim()} onPress={()=>addChapter(s.id)} style={{backgroundColor:t.primary,borderRadius:8,paddingVertical:8,alignItems:'center',marginTop:8,opacity:chSaving||!chTitle.trim()?0.5:1}}>
          {chSaving?<ActivityIndicator color="#fff" size="small"/>:<T style={{color:'#fff',fontWeight:'800',fontSize:12}}>{copy(lang,'addChapter')}</T>}
        </Pressable>
      </View>}
    </View>)}
  {deleteId&&<View style={{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'center',alignItems:'center',padding:24,zIndex:999}}>
    <View style={{width:'100%',backgroundColor:t.card,borderRadius:22,padding:24,alignItems:'center',borderWidth:1,borderColor:t.line}}>
      <View style={{width:56,height:56,borderRadius:28,backgroundColor:'#FEE2E2',alignItems:'center',justifyContent:'center',marginBottom:16}}>
        <Feather name="alert-triangle" size={28} color="#EF4444"/>
      </View>
      <T style={{fontSize:18,fontWeight:'900',color:t.ink,textAlign:'center',marginBottom:8}}>গল্প মুছে ফেলবেন?</T>
      <T style={{fontSize:13,color:t.muted,textAlign:'center',lineHeight:20,marginBottom:20}}>
        {'আপনার গল্পটি মুছে ফেললে আর কেউ এটি পড়তে পারবে না। এই গল্পের সব পর্ব, পছন্দ, ভিউ এবং মন্তব্য সব চিরতরে মুছে যাবে।\n\nএই কাজটি আর ফেরানো যাবে না।'}
      </T>
      <View style={{flexDirection:'row',gap:10,width:'100%'}}>
        <Pressable onPress={()=>setDeleteId(null)} style={{flex:1,height:48,borderRadius:14,backgroundColor:t.tint,alignItems:'center',justifyContent:'center'}}>
          <T style={{color:t.primary,fontWeight:'800',fontSize:14}}>ফিরে যান</T>
        </Pressable>
        <Pressable onPress={confirmDelete} style={{flex:1,height:48,borderRadius:14,backgroundColor:'#EF4444',alignItems:'center',justifyContent:'center'}}>
          <T style={{color:'#fff',fontWeight:'800',fontSize:14}}>মুছে ফেলুন</T>
        </Pressable>
      </View>
    </View>
  </View>}
  </View>}

function WriterProfileStudio({token,theme:t,writer,lang,onUpdate,onDeleteAccount}:{token:string;theme:Theme;writer:any;lang:Language;onUpdate:(patch:any)=>void;onDeleteAccount:()=>void}){
  const[editing,setEditing]=useState(false);
  const[name,setName]=useState(writer?.writer_name||'');
  const[username,setUsername]=useState(writer?.username||'');
  const[bio,setBio]=useState(writer?.bio||'');
  const[avatar,setAvatar]=useState(writer?.avatar_url||'');
  const[saving,setSaving]=useState(false);
  const[saved,setSaved]=useState(false);
  const[uploadingImg,setUploadingImg]=useState(false);
  const[err,setErr]=useState('');
  const handlePickAvatar=async()=>{
    setUploadingImg(true);setErr('');
    const url=await pickAndResizeImage('avatar');
    if(url){setAvatar(url);await updateWriterProfile(token,{avatar_url:url});onUpdate({avatar_url:url})}
    setUploadingImg(false);
  };
  const handleSave=async()=>{
    setSaving(true);setErr('');
    const r=await updateWriterProfile(token,{writer_name:name.trim(),bio:bio.trim(),avatar_url:avatar||undefined,username:username.trim()||undefined});
    setSaving(false);
    if(r.ok){setSaved(true);onUpdate({writer_name:name.trim(),bio:bio.trim(),avatar_url:avatar||undefined,username:username.trim()||undefined});setTimeout(()=>{setSaved(false);setEditing(false)},1500)}
    else setErr(r.error==='Username already taken'?copy(lang,'usernameTaken'):r.error||'');
  };
  return <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':'height'} keyboardVerticalOffset={Platform.OS==='ios'?90:0}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom:40}} keyboardShouldPersistTaps="handled">
    <View style={{alignItems:'center',marginBottom:20}}>
      <Pressable onPress={editing?handlePickAvatar:()=>setEditing(true)} disabled={uploadingImg} style={{marginBottom:10}}>
        {uploadingImg?<View style={{width:90,height:90,borderRadius:45,backgroundColor:t.tint,alignItems:'center',justifyContent:'center'}}><ActivityIndicator size="small" color={t.primary}/></View>:
        (avatar||writer?.avatar_url)?<View><Image source={{uri:avatar||writer?.avatar_url}} style={{width:90,height:90,borderRadius:45}}/>{editing&&<View style={{position:'absolute',bottom:0,right:0,backgroundColor:t.primary,borderRadius:14,width:28,height:28,alignItems:'center',justifyContent:'center',borderWidth:2,borderColor:t.card}}><Feather name="camera" size={13} color="#fff"/></View>}</View>:
        <View style={{width:90,height:90,borderRadius:45,backgroundColor:t.primary,alignItems:'center',justifyContent:'center',elevation:4,shadowColor:t.primary,shadowOffset:{width:0,height:4},shadowOpacity:0.3,shadowRadius:8}}>
          <T style={{fontSize:32,fontWeight:'900',color:'#fff'}}>{writer?.writer_name?.[0]?.toUpperCase()||'?'}</T>
          {editing&&<View style={{position:'absolute',bottom:0,backgroundColor:'rgba(0,0,0,0.4)',borderRadius:14,width:28,height:28,alignItems:'center',justifyContent:'center'}}><Feather name="camera" size={13} color="#fff"/></View>}
        </View>}
      </Pressable>
      {!editing&&<><View style={{flexDirection:'row',alignItems:'center',gap:6}}>
        <T style={{fontSize:20,fontWeight:'900',color:t.ink}}>{writer?.writer_name}</T>
        <BadgeIcon badge={writer?.badge} size={20}/>
      </View>
      <T style={{fontSize:13,color:t.muted,marginTop:3}}>@{writer?.username}</T>
      {writer?.bio&&<T style={{fontSize:13,color:t.muted,marginTop:8,textAlign:'center',lineHeight:20,maxWidth:300}}>{writer?.bio}</T>}
      </>}
    </View>
    {!editing?
    <Pressable onPress={()=>setEditing(true)} style={{flexDirection:'row',alignItems:'center',justifyContent:'center',backgroundColor:t.primary,borderRadius:14,paddingVertical:13,marginBottom:14,gap:8}}>
      <Feather name="edit-2" size={16} color="#fff"/>
      <T style={{fontSize:14,fontWeight:'800',color:'#fff'}}>{copy(lang,'editProfile')}</T>
    </Pressable>:
    <View style={{backgroundColor:t.card,borderRadius:14,padding:16,marginBottom:14,borderWidth:1,borderColor:t.line}}>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
        <T style={{fontSize:14,fontWeight:'800',color:t.ink}}>{copy(lang,'editProfile')}</T>
        <Pressable onPress={()=>{setEditing(false);setErr('')}}><T style={{fontSize:13,fontWeight:'700',color:t.muted}}>{copy(lang,'cancel')}</T></Pressable>
      </View>
      <View style={{marginBottom:12}}>
        <T style={{color:t.muted,fontSize:11,fontWeight:'700',marginBottom:5,marginLeft:4}}>{copy(lang,'username')}</T>
        <View style={{flexDirection:'row',alignItems:'center',backgroundColor:t.bg,borderRadius:12,borderWidth:1.5,borderColor:t.line,paddingHorizontal:12,height:44}}>
          <Feather name="at-sign" size={16} color={t.muted} style={{marginRight:8}}/>
          <TextInput value={username} onChangeText={setUsername} autoCapitalize="none" style={{flex:1,color:t.ink,fontSize:14,fontWeight:'600',fontFamily:GF()}}/>
        </View>
      </View>
      <View style={{marginBottom:12}}>
        <T style={{color:t.muted,fontSize:11,fontWeight:'700',marginBottom:5,marginLeft:4}}>{copy(lang,'writerName')}</T>
        <View style={{flexDirection:'row',alignItems:'center',backgroundColor:t.bg,borderRadius:12,borderWidth:1.5,borderColor:t.line,paddingHorizontal:12,height:44}}>
          <Feather name="user" size={16} color={t.muted} style={{marginRight:8}}/>
          <TextInput value={name} onChangeText={setName} style={{flex:1,color:t.ink,fontSize:14,fontWeight:'600',fontFamily:GF()}}/>
        </View>
      </View>
      <View style={{marginBottom:16}}>
        <T style={{color:t.muted,fontSize:11,fontWeight:'700',marginBottom:5,marginLeft:4}}>{copy(lang,'bio')}</T>
        <View style={{backgroundColor:t.bg,borderRadius:12,borderWidth:1.5,borderColor:t.line,padding:12,minHeight:80}}>
          <TextInput value={bio} onChangeText={setBio} multiline placeholder={copy(lang,'bioPlaceholder')} placeholderTextColor={t.muted+'88'} style={{color:t.ink,fontSize:14,fontWeight:'500',lineHeight:20,fontFamily:GF()}}/>
        </View>
      </View>
      {err?<View style={{backgroundColor:'#FEF2F2',borderRadius:10,padding:10,marginBottom:12,flexDirection:'row',alignItems:'center',gap:6}}><Feather name="alert-circle" size={14} color="#EF4444"/><T style={{fontSize:12,fontWeight:'600',color:'#EF4444',flex:1}}>{err}</T></View>:null}
      <Pressable disabled={saving} onPress={handleSave} style={{backgroundColor:saved?'#10B981':t.primary,borderRadius:12,paddingVertical:12,alignItems:'center'}}>
        {saving?<ActivityIndicator color="#fff" size="small"/>:<T style={{color:'#fff',fontWeight:'800',fontSize:14}}>{saved?'✓ '+copy(lang,'saved'):copy(lang,'save')}</T>}
      </Pressable></View>}
      {/* Delete Account */}
      {!editing&&<View style={{marginTop:20,paddingTop:20,borderTopWidth:1,borderTopColor:t.line}}>
        <T style={{fontSize:11,color:t.muted,textAlign:'center',marginBottom:10}}>{lang==='bn'?'বিপজ্জনক এলাকা':lang==='hi'?'खतरनाक क्षेत्र':'Danger Zone'}</T>
        <Pressable onPress={onDeleteAccount} style={{flexDirection:'row',alignItems:'center',justifyContent:'center',backgroundColor:'#FEE2E2',borderRadius:12,paddingVertical:12,gap:6}}>
          <Feather name="trash-2" size={16} color="#EF4444"/>
          <T style={{fontSize:13,fontWeight:'700',color:'#EF4444'}}>{lang==='bn'?'অ্যাকাউন্ট মুছুন':lang==='hi'?'खाता हटाएँ':'Delete Account'}</T>
        </Pressable>
      </View>}
  </ScrollView></KeyboardAvoidingView>}

function WriterFollowers({token,theme:t,lang}:{token:string;theme:Theme;lang:Language}){
  const[followers,setFollowers]=useState<{id:string;username:string;writer_name:string;bio?:string;avatar_url?:string;follower_count?:number;badge?:string}[]>([]);
  const[loading,setLoading]=useState(true);
  useEffect(()=>{fetchWriterFollowers(token).then(f=>setFollowers(f||[])).finally(()=>setLoading(false))},[token]);
  return <View style={{flex:1}}>
    <T style={{fontSize:16,fontWeight:'900',color:t.ink,marginBottom:14}}>{copy(lang,'followers')}</T>
    {loading?<View style={{alignItems:'center',paddingVertical:40}}><ActivityIndicator color={t.primary}/></View>:
    followers.length===0?<View style={{alignItems:'center',paddingVertical:40}}><Feather name="users" size={28} color={t.muted}/><T style={{fontSize:13,color:t.muted,marginTop:8}}>{lang==='hi'?'कोई अनुसारी नहीं':lang==='en'?'No followers yet':'কোনো অনুসারক নেই'}</T></View>:
    followers.map(w=><View key={w.id} style={{flexDirection:'row',alignItems:'center',backgroundColor:t.card,borderRadius:14,padding:12,marginBottom:8,borderWidth:1,borderColor:t.line}}>
      <View style={{width:44,height:44,borderRadius:22,backgroundColor:t.tint,alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
        {w.avatar_url?<Image source={{uri:w.avatar_url}} style={{width:44,height:44,borderRadius:22}}/>:<T style={{fontSize:18,fontWeight:'900',color:t.primary}}>{w.writer_name[0]?.toUpperCase()||'?'}</T>}
      </View>
      <View style={{flex:1,marginLeft:12}}>
        <View style={{flexDirection:'row',alignItems:'center',gap:5}}>
          <T numberOfLines={1} style={{fontSize:14,fontWeight:'800',color:t.ink}}>{w.writer_name}</T>
          <BadgeIcon badge={w.badge} size={14}/>
        </View>
        <T numberOfLines={1} style={{fontSize:11,color:t.muted,marginTop:1}}>@{w.username}</T>
      </View>
      <View style={{alignItems:'center'}}>
        <Feather name="users" size={12} color={t.muted}/>
        <T style={{fontSize:10,color:t.muted,marginTop:2}}>{w.follower_count||0}</T>
      </View>
    </View>)}
  </View>
}

function WriterNotifs({token,theme:t,lang,deviceID,p}:{token:string;theme:Theme;lang:Language;deviceID:string;p:C}){
  const[notifs,setNotifs]=useState<{id:string;title:string;body:string;type:string;is_read:boolean;url?:string;avatar_url?:string;story_title?:string;story_cover?:string;created_at:string}[]>([]);
  const[loading,setLoading]=useState(true);
  const[selNotif,setSelNotif]=useState<{id:string;title:string;body:string;type:string;is_read:boolean;url?:string;avatar_url?:string;story_title?:string;story_cover?:string;created_at:string}|null>(null);
  const[followedBack,setFollowedBack]=useState<Record<string,boolean>>({});
  useEffect(()=>{fetchWriterNotifications(token).then(n=>setNotifs(n||[])).finally(()=>setLoading(false))},[token]);
  const markAll=async()=>{await markWriterNotificationsRead(token);setNotifs(n=>n.map(x=>({...x,is_read:true})))};
  const deleteNotif=async(id:string)=>{await deleteWriterNotification(token,id);setNotifs(n=>n.filter(x=>x.id!==id))};
  const followBack=async(nid:string,fwid:string)=>{
    const ok=await followWriter(deviceID,fwid,p.state.writer?.id,p.state.user?.id);
    if(ok)setFollowedBack(p=>({...p,[nid]:true}));
  };
  const typeIcon=(type:string)=>type==='approved'?'check-circle':type==='rejected'?'x-circle':type==='warning'?'alert-triangle':type==='removed'?'trash-2':type==='info'?'info':type==='follow'?'user-plus':type==='like'?'heart':type==='comment'?'message-circle':'bell';
  const typeColor=(type:string)=>type==='approved'?'#10B981':type==='rejected'?'#EF4444':type==='warning'?'#F59E0B':type==='removed'?'#DC2626':type==='follow'?'#EC4899':type==='like'?'#EF4444':type==='comment'?'#3B82F6':'#6366F1';
  const openDetail=(n:{id:string;title:string;body:string;type:string;is_read:boolean;url?:string;created_at:string})=>{
    if(!n.is_read){setNotifs(prev=>prev.map(x=>x.id===n.id?{...x,is_read:true}:x));markWriterNotificationsRead(token,[n.id])}
    setSelNotif(n);
  };
  if(selNotif)return <View style={{flex:1}}>
    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
      <View style={{flexDirection:'row',alignItems:'center',gap:10}}>
        <Pressable onPress={()=>setSelNotif(null)}><Feather name="arrow-left" size={20} color={t.ink}/></Pressable>
        <T style={{fontSize:16,fontWeight:'900',color:t.ink}}>{copy(lang,'notifications')}</T>
      </View>
      <Pressable onPress={()=>{deleteNotif(selNotif.id);setSelNotif(null)}} style={{padding:6}}><Feather name="trash-2" size={16} color="#EF4444"/></Pressable>
    </View>
    <View style={{alignItems:'center',marginBottom:18}}>
      {selNotif.avatar_url?<Image source={{uri:selNotif.avatar_url}} style={{width:56,height:56,borderRadius:28,marginBottom:8}}/>:<View style={{width:56,height:56,borderRadius:28,backgroundColor:typeColor(selNotif.type)+'18',alignItems:'center',justifyContent:'center',marginBottom:8}}>
        <Feather name={typeIcon(selNotif.type) as any} size={24} color={typeColor(selNotif.type)}/>
      </View>}
      <T style={{fontSize:16,fontWeight:'800',color:t.ink,textAlign:'center'}}>{selNotif.title}</T>
      <T style={{fontSize:11,color:t.muted,marginTop:3}}>{new Date(selNotif.created_at).toLocaleString()}</T>
    </View>
    {selNotif.story_cover&&<View style={{alignSelf:'center',marginBottom:14,borderRadius:12,overflow:'hidden'}}><Image source={{uri:selNotif.story_cover}} style={{width:100,height:140,borderRadius:12}} resizeMode="cover"/></View>}
    <View style={{backgroundColor:t.card,borderRadius:14,padding:16,borderWidth:1,borderColor:t.line}}>
      <T style={{fontSize:14,color:t.ink,lineHeight:22}}>{selNotif.body}</T>
    </View>
    {selNotif.type==='follow'&&selNotif.url&&!followedBack[selNotif.id]&&<Pressable onPress={()=>followBack(selNotif.id,selNotif.url!)} style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,marginTop:14,backgroundColor:t.primary,borderRadius:12,paddingVertical:12}}>
      <Feather name="user-plus" size={15} color="#fff"/><T style={{fontSize:13,fontWeight:'700',color:'#fff'}}>{copy(lang,'follow')}</T>
    </Pressable>}
  </View>;
  return <View style={{flex:1}}>
    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
      <T style={{fontSize:16,fontWeight:'900',color:t.ink}}>{copy(lang,'notifications')}</T>
      <View style={{flexDirection:'row',gap:8}}>
        {notifs.some(n=>!n.is_read)&&<Pressable onPress={markAll} style={{paddingHorizontal:10,paddingVertical:5,borderRadius:8,backgroundColor:t.tint}}>
          <T style={{fontSize:11,fontWeight:'700',color:t.primary}}>{copy(lang,'markAllRead')}</T>
        </Pressable>}
        {notifs.length>0&&<Pressable onPress={async()=>{const ids=notifs.map(n=>n.id);setNotifs([]);await Promise.all(ids.map(id=>deleteWriterNotification(token,id)))}} style={{paddingHorizontal:5,paddingVertical:5,borderRadius:8,backgroundColor:t.tint}}>
          <Feather name="trash-2" size={13} color="#EF4444"/>
        </Pressable>}
      </View>
    </View>
    {loading?<View style={{alignItems:'center',paddingVertical:40}}><ActivityIndicator color={t.primary}/></View>:
    notifs.length===0?<View style={{alignItems:'center',paddingVertical:40}}><Feather name="bell" size={28} color={t.muted}/><T style={{fontSize:13,color:t.muted,marginTop:8}}>{copy(lang,'noNotifications')}</T></View>:
    notifs.map(n=><Pressable key={n.id} onPress={()=>openDetail(n)} style={{flexDirection:'row',alignItems:'flex-start',backgroundColor:n.is_read?t.card:t.tint,borderRadius:12,padding:12,marginBottom:6,borderWidth:1,borderColor:n.is_read?t.line:t.primary+'30',borderLeftWidth:3,borderLeftColor:typeColor(n.type)}}>
      {n.avatar_url?<Image source={{uri:n.avatar_url}} style={{width:34,height:34,borderRadius:17,marginRight:10}}/>:<View style={{width:30,height:30,borderRadius:8,backgroundColor:typeColor(n.type)+'18',alignItems:'center',justifyContent:'center',marginRight:10}}>
        <Feather name={typeIcon(n.type) as any} size={14} color={typeColor(n.type)}/>
      </View>}
      <View style={{flex:1}}>
        <T numberOfLines={1} style={{fontSize:13,fontWeight:'700',color:t.ink}}>{n.title}</T>
        <T numberOfLines={2} style={{fontSize:12,color:t.muted,marginTop:2,lineHeight:17}}>{n.body}</T>
        <T style={{fontSize:10,color:t.muted,marginTop:4}}>{new Date(n.created_at).toLocaleDateString()}</T>
      </View>
      {!n.is_read&&<View style={{width:8,height:8,borderRadius:4,backgroundColor:t.primary,marginLeft:8,marginTop:4}}/>}
    </Pressable>)}
  </View>}

function Back({title,theme,onPress}:{title:string;theme:Theme;onPress:()=>void}){return <View style={styles.back}><Pressable onPress={onPress}><Feather name="arrow-left" size={22} color={theme.ink}/></Pressable><T style={[styles.backTitle,{color:theme.ink}]}>{title}</T><View style={{width:22}}/></View>}
function Section({title,theme,action,seeAllText}:{title:string;theme:Theme;action?:()=>void;seeAllText?:string}){return <View style={styles.section}><T style={[styles.sectionTitle,{color:theme.ink}]}>{title}</T>{action&&<Pressable onPress={action}><T style={{color:theme.primary,fontWeight:'800',fontSize:12}}>{seeAllText||'See all →'}</T></Pressable>}</View>}
function Cover({book,large}:{book:Book;large?:boolean}){const hideAll=book.hide_title_on_cover&&book.cover_url;return <View style={[styles.cover,large&&styles.coverLarge,{backgroundColor:book.color}]}>{book.cover_url?<Image source={{uri:book.cover_url}} style={{position:'absolute',top:0,left:0,right:0,bottom:0,borderRadius:large?16:9}} resizeMode="cover"/>:null}{!hideAll&&book.cover_url&&<View style={{position:'absolute',top:0,left:0,right:0,bottom:0,borderRadius:large?16:9,backgroundColor:'rgba(0,0,0,0.15)'}}/>}{!hideAll&&<Feather name={I(book.categoryIcon)} size={large?27:20} color={book.accent}/>}{!hideAll&&!book.hide_title_on_cover&&<T numberOfLines={3} style={[styles.coverTitle,large&&{fontSize:17}]}>{book.title}</T>}{!hideAll&&!book.hide_title_on_cover&&<View style={{height:2,width:24,backgroundColor:book.accent,marginVertical:7}}/>}{!hideAll&&<T style={styles.coverAuthor}>{book.author}</T>}</View>}
function Episode({book,theme,onPress}:{book:Book;theme:Theme;onPress:()=>void}){const c=book.chapters[book.chapters.length-1];return <Pressable onPress={onPress} style={[styles.episode,{backgroundColor:theme.card,borderColor:theme.line}]}><Cover book={book}/><View style={{flex:1}}><T style={{color:theme.primary,fontSize:10,fontWeight:'900'}}>নতুন পর্ব</T><T style={[styles.rowTitle,{color:theme.ink}]}>{book.title}</T><T style={{color:theme.muted,fontSize:11,marginTop:4}}>পর্ব {book.chapters.length}: {c?.title||'—'}</T></View><Feather name="play-circle" size={23} color={theme.primary}/></Pressable>}
function Featured(props: C & { list?: Book[] }){const p=props as C;const {width}=useWindowDimensions();const W=width-36;const items=(props.list&&props.list.length?props.list:p.allBooks.slice(0,6));const N=items.length;const anim=useRef(new Animated.Value(0)).current;const idxRef=useRef(0);const[idx,setIdx]=useState(0);const setter=(i:number)=>{idxRef.current=((i%N)+N)%N;setIdx(idxRef.current)};useEffect(()=>{Animated.timing(anim,{toValue:-idx*W,duration:450,useNativeDriver:true}).start()},[idx,anim,W]);useEffect(()=>{if(N<2)return;const id=setInterval(()=>setter(idxRef.current+1),4000);return()=>clearInterval(id)},[N,setter]);const pan=useRef(PanResponder.create({onStartShouldSetPanResponder:(e:{nativeEvent:{locationY:number;locationX:number}})=>{if(e.nativeEvent.locationY<60&&e.nativeEvent.locationX>W-80)return false;return true},onMoveShouldSetPanResponder:()=>N>1,onPanResponderRelease:(_,g)=>{if(N<2)return;if(g.dx<-50)setter(idxRef.current+1);else if(g.dx>50)setter(idxRef.current-1)}})).current;if(!N)return null;return <View><View style={{overflow:'hidden',borderRadius:24}}><Animated.View style={{flexDirection:'row',width:W*N,transform:[{translateX:anim}]}} {...pan.panHandlers}>{items.map((b,i)=><View key={b.id} style={{width:W}}><FeaturedCard book={b} p={p} rank={i}/></View>)}</Animated.View></View><View style={{flexDirection:'row',justifyContent:'center',gap:6,marginTop:12}}>{items.map((_,i)=>{const on=i===idx;return <View key={i} style={[styles.dot,{width:on?18:6,backgroundColor:on?p.theme.primary:p.theme.line}]}/>})}</View></View>}
function shade(hex:string,amt:number):string{const h=hex.replace('#','');if(h.length!==6)return hex;const n=parseInt(h,16);let r=(n>>16)&255,g=(n>>8)&255,b=n&255;const t=amt<0?0:255;const q=Math.abs(amt)/100;r=Math.round((t-r)*q+r);g=Math.round((t-g)*q+g);b=Math.round((t-b)*q+b);const z=(x:number)=>('0'+x.toString(16)).slice(-2);return '#'+z(r)+z(g)+z(b)}
function FeaturedCard({book,p,rank}:{book:Book;p:C;rank:number}){const base=book.color||'#123E39';const accent=book.accent||'#F5C660';const dark=shade(base,-32);const isBm=p.state.bookmarks.includes(book.id);const bmScale=React.useRef(new Animated.Value(1)).current;const bmAnim=()=>{Animated.sequence([Animated.timing(bmScale,{toValue:0.6,duration:80,useNativeDriver:true}),Animated.spring(bmScale,{toValue:1,friction:3,tension:300,useNativeDriver:true})]).start()};const open=()=>p.open(book.id);const toggleBm=()=>{bmAnim();p.update({bookmarks:isBm?p.state.bookmarks.filter(x=>x!==book.id):[...p.state.bookmarks,book.id]})};const metaW=book.views_visible!==false;const readLabel=p.state.settings.language==='hi'?'अभी पढ़ें':p.state.settings.language==='en'?'Read Now':'এখনই পড়ুন';return <View style={[featStyles.card,{backgroundColor:base}]}><LinearGradient colors={[base,dark]} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFill}/><Svg style={StyleSheet.absoluteFill} pointerEvents="none"><Circle cx="92%" cy={18} r={92} fill={accent+'26'}/><Circle cx="-14" cy={205} r={118} fill="#ffffff10"/><Ellipse cx="34%" cy={262} rx={165} ry={80} fill={accent+'16'}/><Circle cx="70%" cy={248} r={70} fill="#ffffff0c"/></Svg><View style={featStyles.top}><View style={[featStyles.rank,{backgroundColor:accent}]}><T style={[featStyles.rankText,{color:base}]}>#{rank+1}</T></View><Animated.View style={{transform:[{scale:bmScale}]}}><Pressable onPress={toggleBm} hitSlop={10} style={[featStyles.bm,{borderColor:'#ffffff44'}]}><Feather name="bookmark" size={15} color={isBm?accent:'#fff'}/></Pressable></Animated.View></View><View style={featStyles.row}><View style={featStyles.left}><View style={{flexDirection:'row',alignItems:'center',gap:6}}><View style={[featStyles.tag,{backgroundColor:accent+'33'}]}><T style={[featStyles.tagText,{color:accent}]}>✦ {tr(p,'popular')}</T></View>
              {book.writer_status==='ongoing'&&<View style={[featStyles.tag,{backgroundColor:'#10B98133'}]}><T style={[featStyles.tagText,{color:'#34D399'}]}>ধারাবাহিক</T></View>}
              {book.writer_status==='complete'&&<View style={[featStyles.tag,{backgroundColor:'#F59E0B33'}]}><T style={[featStyles.tagText,{color:'#FBBF24'}]}>সম্পূর</T></View>}
            </View><T numberOfLines={2} style={featStyles.title}>{book.title}</T><T numberOfLines={1} style={featStyles.author}>{book.author}</T><View style={featStyles.meta}>{metaW&&<View style={featStyles.metaC}><Feather name="eye" size={10} color="#E7F2EE"/><T style={featStyles.metaT}>{book.views}</T></View>}<View style={featStyles.metaC}><Feather name="star" size={10} color={accent}/><T style={featStyles.metaT}>{book.rating}</T></View><View style={featStyles.metaC}><Feather name={I(book.categoryIcon)} size={10} color="#E7F2EE"/><T style={featStyles.metaT} numberOfLines={1}>{book.category}</T></View></View><Pressable onPress={()=>p.read(book.id,0)} style={[featStyles.btn,{backgroundColor:accent}]}><Feather name="book-open" size={12} color={base}/><T style={[featStyles.btnText,{color:base}]}>{readLabel}</T></Pressable></View><Pressable onPress={open} style={featStyles.coverWrap}>{book.cover_url?<Image source={{uri:book.cover_url}} style={featStyles.coverImg}/>:<View style={[featStyles.coverImg,{backgroundColor:book.color}]}><Feather name={I(book.categoryIcon)} size={30} color={book.accent}/></View>}</Pressable></View></View>}
const BookCard=React.memo(function BookCard({book,theme,lang,rank,accent,onPress,section}:{book:Book;theme:Theme;lang:Language;rank?:number;accent?:string;onPress:()=>void;section?:string}){const hasStatus=Boolean(book.display_status);const showBadge=hasStatus&&(section==='newEpisodes'||section==='mostPopular');return <Pressable onPress={onPress} style={{width:130}}><View style={{position:'relative'}}><Cover book={book}/>{typeof rank==='number'?<View style={[styles.rankBadge,{backgroundColor:rank===0?accent:rank===1?accent:rank<3?(accent||'#888')+'DD':'#555555DD'}]}><T style={[styles.rankBadgeText,{color:rank<2?'#fff':'#fff'}]}>{rank+1}</T></View>:showBadge&&<View style={[styles.statusBadge,{backgroundColor:book.display_status==='new'?'#8B5CF6':'#10B981'}]}><T style={[styles.statusBadgeText,{color:'#fff'}]}>{book.display_status==='new'?copy(lang,'statusNew'):copy(lang,'statusOngoing')}</T></View>}{book.views_visible !== false && <View style={styles.viewBadge}><Feather name="eye" size={10} color="#fff"/><T style={styles.viewBadgeText}>{book.views}</T></View>}</View><T numberOfLines={2} style={[styles.bookName,{color:theme.ink}]}>{book.title}</T><T numberOfLines={1} style={{color:theme.muted,fontSize:11}}>{book.author}</T></Pressable>});
function GoogleIcon({size}:{size?:number}){
  const s=size||20;
  return <Svg width={s} height={s} viewBox="0 0 48 48">
    <Path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
    <Path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
    <Path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
    <Path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
  </Svg>;
}
function BadgeIcon({badge,size}:{badge?:string;size?:number}){
  if(!badge||badge==='none')return null;
  const s=size||18;
  if(badge==='verified')return <Image source={require('./assets/verified-badge.png')} style={{width:s,height:s}}/>;
  if(badge==='popular')return <Svg width={14} height={14} viewBox="0 0 24 24"><Path d="M22.5 12.5c0-1.58-1.2-2.87-2.75-3.02C19.36 6.72 18.18 4.14 15.96 2.71 13.74 1.28 10.99 1.35 8.79 2.88 6.59 4.41 5.55 7.19 6.14 9.87 4.28 10.36 2.82 11.97 2.5 14c-.32 2.03.66 4.09 2.44 5.22 1.78 1.13 4.07 1.18 5.9.16.43.95 1.18 1.77 2.16 2.33.98.56 2.14.84 3.3.84 1.58 0 3.07-.6 4.21-1.7 1.14-1.1 1.77-2.59 1.77-4.17 0-.29-.04-.57-.11-.85.99-.78 1.7-1.94 1.88-3.28.18-1.34-.32-2.72-1.36-3.73z" fill="#800020"/><Path d="M10 15.5l-3.5-3.5 1.41-1.41L10 12.67l5.09-5.09 1.41 1.41L10 15.5z" fill="#fff"/></Svg>;
  if(badge==='top')return <Svg width={14} height={14} viewBox="0 0 24 24"><Path d="M12 2l2.4 2.4L18 3.2l.8 3.6 3.2 1.6-1.6 3.2L22 15l-3.2 1.6-.8 3.6-3.6-.8L12 22l-2.4-2.4L6 20.8l-.8-3.6L2 15.6l1.6-3.2L2 9l3.2-1.6.8-3.6L10.4 4.4z" fill="#1B5E20"/><Path d="M8 12.5l2.5 2.5L16 9.5" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></Svg>;
  return null;
}
function AuthorCard({writer,theme,lang,onPress,bookCount}:{writer:import('./src/types').WriterProfile;theme:Theme;lang:Language;onPress:()=>void;bookCount:number}){
  const bg=theme.tint;const ring=theme.primary;
  return <Pressable onPress={onPress} style={[dStyles.writerCard,{backgroundColor:theme.card,borderColor:theme.line}]}>
    <View style={[dStyles.writerCardBg,{backgroundColor:bg}]}/>
    <View style={dStyles.writerAvatarWrap}>
      <View style={[dStyles.writerAvatar,{borderColor:theme.card,backgroundColor:bg}]}>
        {writer.avatar_url?<Image source={{uri:writer.avatar_url}} style={StyleSheet.absoluteFill}/>:<T style={{fontSize:28,fontWeight:'900',color:ring}}>{writer.writer_name[0]?.toUpperCase()||'?'}</T>}
      </View>
    </View>
    <View style={dStyles.writerCardBody}>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:4}}>
        <T numberOfLines={1} style={[dStyles.writerName,{color:theme.ink}]}>{writer.writer_name}</T>
        <BadgeIcon badge={writer.badge} size={15}/>
      </View>
      <T numberOfLines={1} style={[dStyles.writerUsername,{color:theme.muted}]}>@{writer.username}</T>
      <View style={[dStyles.writerStatsRow,{borderColor:theme.line}]}>
        <View style={dStyles.writerStat}><Feather name="book-open" size={12} color={theme.primary}/><T style={[dStyles.writerStatNum,{color:theme.ink}]}>{bookCount}</T><T style={[dStyles.writerStatLabel,{color:theme.muted}]}>{copy(lang,'books')}</T></View>
        <View style={dStyles.writerStat}><Feather name="users" size={12} color={theme.primary}/><T style={[dStyles.writerStatNum,{color:theme.ink}]}>{writer.follower_count||0}</T><T style={[dStyles.writerStatLabel,{color:theme.muted}]}>{copy(lang,'followers')}</T></View>
      </View>
    </View>
  </Pressable>}
function Row({book,theme,onPress}:{book:Book;theme:Theme;onPress:()=>void}){return <Pressable onPress={onPress} style={[styles.row,{backgroundColor:theme.card,borderColor:theme.line}]}><Cover book={book}/><View style={{flex:1}}><T style={[styles.rowTitle,{color:theme.ink}]}>{book.title}</T><T style={{color:theme.primary,fontSize:12,marginTop:4}}>{book.author}</T><View style={{flexDirection:'row',alignItems:'center',gap:3}}><Feather name="eye" size={12} color={theme.muted}/><T style={{color:theme.muted,fontSize:11}}>{book.views_visible !== false ? `${book.views} • ${book.category}` : book.category}</T></View></View><Feather name="chevron-right" size={18} color={theme.muted}/></Pressable>}
function Link({title,icon,n,theme,onPress}:{title:string;icon:string;n:number;theme:Theme;onPress:()=>void}){return <Pressable onPress={onPress} style={[styles.link,{backgroundColor:theme.card,borderColor:theme.line}]}><View style={[styles.linkIcon,{backgroundColor:theme.tint}]}><Feather name={I(icon)} size={20} color={theme.primary}/></View><T style={[styles.rowTitle,{color:theme.ink}]}>{title}</T><T style={{color:theme.muted,fontSize:10}}>{n}টি</T></Pressable>}
function Menu({title,icon,theme,onPress}:{title:string;icon:string;theme:Theme;onPress:()=>void}){return <Pressable onPress={onPress} style={[styles.menu,{backgroundColor:theme.card,borderBottomColor:theme.line}]}><View style={[styles.menuIcon,{backgroundColor:theme.tint}]}><Feather name={I(icon)} size={17} color={theme.primary}/></View><T style={[styles.rowTitle,{color:theme.ink,flex:1}]}>{title}</T><Feather name="chevron-right" size={18} color={theme.muted}/></Pressable>}
function Toggle({title,icon,value,theme,onChange}:{title:string;icon:string;value:boolean;theme:Theme;onChange:(v:boolean)=>void}){return <View style={[styles.menu,{backgroundColor:theme.card,borderBottomColor:theme.line}]}><View style={[styles.menuIcon,{backgroundColor:theme.tint}]}><Feather name={I(icon)} size={17} color={theme.primary}/></View><T style={[styles.rowTitle,{color:theme.ink,flex:1}]}>{title}</T><Switch value={value} onValueChange={onChange} trackColor={{true:theme.primary}}/></View>}
function Action({icon,label,active,theme,onPress}:{icon:string;label:string;active:boolean;theme:Theme;onPress:()=>void}){return <Pressable onPress={onPress} style={{alignItems:'center',gap:5}}><View style={[styles.action,{backgroundColor:active?theme.primary:theme.card,borderColor:theme.line}]}><Feather name={I(icon)} size={17} color={active?'#fff':theme.ink}/></View><T style={{color:active?theme.primary:theme.muted,fontSize:10,fontWeight:'800'}}>{label}</T></Pressable>}
function Button({title,icon,disabled,onPress}:{title:string;icon:string;disabled?:boolean;onPress:()=>void}){return <Pressable disabled={disabled} onPress={onPress} style={[styles.button,disabled&&{opacity:.4}]}><T style={styles.buttonText}>{title}</T><Feather name={I(icon)} size={18} color="#fff"/></Pressable>}
function Empty({theme}:{theme:Theme}){return <View style={styles.empty}><Feather name="book" size={28} color={theme.primary}/><T style={[styles.rowTitle,{color:theme.ink,marginTop:10}]}>এখানে এখনো কিছু নেই</T><T style={{color:theme.muted,marginTop:5}}>গল্প পড়তে শুরু করুন</T></View>}
function FlowerArt({kind,primary,tint,bg,s=40}:{kind:string;primary:string;tint:string;bg:string;s?:number}){
  const petal=(ang:number,rx:number,ry:number,col:string,op=0.92,pad=0)=><Ellipse cx={50} cy={50-ry-pad} rx={rx} ry={ry} fill={col} opacity={op} transform={`rotate(${ang} 50 50)`}/>;
  const R=(n:number)=>(()=>{const a:number[]=[];for(let i=0;i<n;i++)a.push((360/n)*i);return a})();
  const ring=(n:number,rx:number,ry:number,col:string,op=0.92,pad=0)=>R(n).map(x=>(<Ellipse key={x} cx={50} cy={50-ry-pad} rx={rx} ry={ry} fill={col} opacity={op} transform={`rotate(${x} 50 50)`}/>));
  return <Svg width={s} height={s} viewBox="0 0 100 100">
    <Circle cx={50} cy={50} r={49} fill={bg}/>
    {kind==='golap'
      ? <G>{ring(18,11,22,primary,0.55)}<G>{ring(9,10,18,tint,0.7,2)}</G><Circle cx={50} cy={50} r={9} fill={bg}/></G>
      : <G>{ring(8,12,28,primary)}<G>{ring(6,9,20,tint,0.85,7)}</G><Circle cx={50} cy={50} r={8} fill="#E8C33A"/></G>}
  </Svg>;
}
type ThemeId = import('./src/types').ThemeId;
const themePalettes:Record<ThemeId,{light:{dark:boolean;primary:string;bg:string;card:string;ink:string;muted:string;line:string;tint:string;reader:string};dark:{dark:boolean;primary:string;bg:string;card:string;ink:string;muted:string;line:string;tint:string;reader:string}}>={
katagolap:{light:{dark:false,primary:'#087A63',bg:'#F5FAF8',card:'#FFFFFF',ink:'#172421',muted:'#71817D',line:'#E2ECE8',tint:'#DDF5EC',reader:'#FBFCF7'},dark:{dark:true,primary:'#59C9AA',bg:'#0E1514',card:'#17211F',ink:'#F1F6F4',muted:'#91A39E',line:'#293834',tint:'#203D36',reader:'#111917'}},
sepia:{light:{dark:false,primary:'#8B6914',bg:'#FBF7F0',card:'#FFFFFF',ink:'#2C2416',muted:'#8C7E6A',line:'#E8DFD0',tint:'#F3EDE0',reader:'#FDFBF7'},dark:{dark:true,primary:'#D4A843',bg:'#1A1508',card:'#241E12',ink:'#F0E8D8',muted:'#9A8B6E',line:'#3A3220',tint:'#2E2714',reader:'#16120A'}},
midnight:{light:{dark:false,primary:'#4A6CF7',bg:'#F4F6FF',card:'#FFFFFF',ink:'#1A1F36',muted:'#6B7394',line:'#D8DDF0',tint:'#E4E8F8',reader:'#FAFBFF'},dark:{dark:true,primary:'#7B96FF',bg:'#0B0E1A',card:'#151A2E',ink:'#E8ECFF',muted:'#6B7394',line:'#262D4A',tint:'#1C2240',reader:'#0D1020'}},
godhuli:{light:{dark:false,primary:'#C05621',bg:'#FFF8F3',card:'#FFFFFF',ink:'#2D1B0E',muted:'#8C6E56',line:'#EDD8C8',tint:'#F8EDE2',reader:'#FFFCF9'},dark:{dark:true,primary:'#ED8936',bg:'#1A0F06',card:'#261A0E',ink:'#F8E8D8',muted:'#9A7E60',line:'#3A2E1E',tint:'#2E2214',reader:'#160E08'}},
sagar:{light:{dark:false,primary:'#1A7FA0',bg:'#F2FAFD',card:'#FFFFFF',ink:'#0F2B33',muted:'#5C8A96',line:'#C8E2EA',tint:'#D8EFF5',reader:'#F8FCFD'},dark:{dark:true,primary:'#38B2D6',bg:'#061218',card:'#0E1E24',ink:'#D8F0F8',muted:'#5C8A96',line:'#1E3440',tint:'#142A32',reader:'#081418'}},
oronno:{light:{dark:false,primary:'#2D7A3A',bg:'#F3FAF4',card:'#FFFFFF',ink:'#1A2E1E',muted:'#5C7A60',line:'#C8E4CC',tint:'#D8F0DA',reader:'#F8FCF9'},dark:{dark:true,primary:'#4CAF5A',bg:'#0A1A0C',card:'#142816',ink:'#D8F0DC',muted:'#5C7A60',line:'#1E3420',tint:'#162C18',reader:'#0C1C0E'}},
lavender:{light:{dark:false,primary:'#7C3AED',bg:'#F8F5FF',card:'#FFFFFF',ink:'#1E1533',muted:'#7C6E94',line:'#DDD4F0',tint:'#ECE6F8',reader:'#FCFAFF'},dark:{dark:true,primary:'#A78BFA',bg:'#120E1E',card:'#1C1530',ink:'#EDE6FF',muted:'#7C6E94',line:'#302848',tint:'#241E3C',reader:'#141020'}},
golapi:{light:{dark:false,primary:'#D94A7A',bg:'#FFF5F8',card:'#FFFFFF',ink:'#2E1520',muted:'#8C5E72',line:'#F0D0DC',tint:'#F8E2EA',reader:'#FFFAFC'},dark:{dark:true,primary:'#F472B6',bg:'#1A0C12',card:'#281520',ink:'#FFE8F0',muted:'#8C5E72',line:'#3E2430',tint:'#301C28',reader:'#1C0E14'}},
  shapla:{light:{dark:false,primary:'#0E9AA7',bg:'#F0FBFD',card:'#FFFFFF',ink:'#0E2A2E',muted:'#5C848C',line:'#C8E8EC',tint:'#D9F2F5',reader:'#F6FCFD'},dark:{dark:true,primary:'#2EC4C9',bg:'#071A1D',card:'#0F282C',ink:'#DCF5F7',muted:'#5C848C',line:'#1E3E42',tint:'#133235',reader:'#091B1E'}},
  golap:{light:{dark:false,primary:'#E63946',bg:'#FFF6F7',card:'#FFFFFF',ink:'#3A1520',muted:'#99505C',line:'#F0CCD2',tint:'#F9E3E7',reader:'#FFFBFC'},dark:{dark:true,primary:'#FF6B7A',bg:'#20090F',card:'#33121C',ink:'#FFE7EC',muted:'#99505C',line:'#4A1E28',tint:'#3A1620',reader:'#220B11'}}};
function themeFor(themeId:ThemeId,dark:boolean){return themePalettes[themeId]?.[dark?'dark':'light']||themePalettes.katagolap[dark?'dark':'light']}
const styles=StyleSheet.create({center:{flex:1,alignItems:'center',justifyContent:'center'},logo:{width:76,height:76,borderRadius:25,backgroundColor:'#087A63',alignItems:'center',justifyContent:'center',elevation:8},brand:{fontSize:25,fontWeight:'900',marginTop:16},gate:{flex:1},art:{height:'38%',backgroundColor:'#DDF8EF',alignItems:'center',justifyContent:'center'},gateBody:{flex:1,padding:25,justifyContent:'center'},eyebrow:{fontSize:12,fontWeight:'900',letterSpacing:1},gateTitle:{fontSize:30,lineHeight:39,fontWeight:'900',marginTop:8},copy:{fontSize:14,lineHeight:22,marginVertical:14},input:{height:55,borderWidth:1,borderRadius:17,paddingHorizontal:16,fontSize:16,fontFamily:'HindSiliguriMedium'},note:{textAlign:'center',fontSize:11,marginTop:14},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:23},title:{fontSize:25,fontWeight:'900'},feature:{height:214,borderRadius:24,padding:18,flexDirection:'row',alignItems:'center',overflow:'hidden'},tag:{color:'#F7D87D',fontSize:11,fontWeight:'900',marginBottom:10},featureTitle:{color:'#fff',fontSize:23,lineHeight:30,fontWeight:'900'},featureAuthor:{color:'#D1E6DF',fontSize:12,marginTop:5},readPill:{backgroundColor:'#F5D578',borderRadius:11,padding:11,alignSelf:'flex-start',marginTop:15},cover:{width:124,height:169,borderRadius:9,padding:11,justifyContent:'flex-end',overflow:'hidden'},coverLarge:{width:137,height:188,transform:[{rotate:'2deg'}]},coverTitle:{color:'#fff',fontWeight:'900',fontSize:14,lineHeight:18},coverAuthor:{fontSize:8,color:'#FFFFFFAA'},featureCard:{height:214,borderRadius:24,padding:18,flexDirection:'row',alignItems:'center',overflow:'hidden'},featTag:{color:'#F7D87D',fontSize:11,fontWeight:'900',marginBottom:8},featTitle:{color:'#fff',fontSize:21,lineHeight:28,fontWeight:'900'},featAuthor:{color:'#D1E6DF',fontSize:12,marginTop:4},featDesc:{color:'#D1E6DF',fontSize:11,lineHeight:16,marginTop:8},featBtn:{backgroundColor:'#F5D578',borderRadius:11,paddingVertical:9,paddingHorizontal:13,alignSelf:'flex-start',marginTop:12},featBtnText:{fontWeight:'900',color:'#173D34',fontSize:12},dot:{height:6,borderRadius:3},statusBadge:{position:'absolute',top:8,left:8,alignSelf:'flex-start',borderRadius:7,paddingVertical:3,paddingHorizontal:7,backgroundColor:'#087A63'},statusBadgeText:{fontSize:9,fontWeight:'900',letterSpacing:0.5,color:'#fff'},rankBadge:{position:'absolute',top:-6,left:-6,minWidth:30,height:30,borderRadius:10,alignItems:'center',justifyContent:'center',paddingHorizontal:5,borderWidth:2.5,borderColor:'#fff'},rankBadgeText:{fontSize:15,fontWeight:'900'},viewBadge:{position:'absolute',bottom:8,right:8,flexDirection:'row',alignItems:'center',gap:3,borderRadius:8,paddingVertical:3,paddingHorizontal:7,backgroundColor:'rgba(0,0,0,0.65)'},viewBadgeText:{color:'#fff',fontSize:10,fontWeight:'800'},secHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:28,marginBottom:14},secIcon:{width:34,height:34,borderRadius:17,alignItems:'center',justifyContent:'center'},seeAllPill:{borderRadius:20,paddingVertical:8,paddingHorizontal:16},section:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:28,marginBottom:14},sectionTitle:{fontSize:20,fontWeight:'900'},bookName:{fontSize:14,fontWeight:'800',lineHeight:20,marginTop:10},episode:{minHeight:98,borderRadius:18,borderWidth:1,padding:10,flexDirection:'row',alignItems:'center',gap:12,marginBottom:10},row:{minHeight:100,borderRadius:18,borderWidth:1,padding:10,flexDirection:'row',alignItems:'center',gap:12,marginBottom:10},rowTitle:{fontSize:14,fontWeight:'800'},tabs:{height:76,borderTopWidth:1,flexDirection:'row',paddingTop:9},tab:{flex:1,alignItems:'center',gap:4},grid2:{flexDirection:'row',flexWrap:'wrap',gap:10},link:{width:'48.4%',borderRadius:18,borderWidth:1,padding:13},linkIcon:{width:40,height:40,borderRadius:13,alignItems:'center',justifyContent:'center',marginBottom:12},catGrid:{flexDirection:'row',flexWrap:'wrap',gap:12},catCard:{width:'47%'},catImgWrap:{borderRadius:16,overflow:'hidden',height:140},catImg:{width:'100%',height:140},catImgFallback:{width:'100%',height:140,alignItems:'center',justifyContent:'center'},catImgOverlay:{position:'absolute',bottom:0,left:0,right:0,backgroundColor:'rgba(0,0,0,0.35)',paddingVertical:8,paddingHorizontal:10},catImgName:{color:'#fff',fontSize:14,fontWeight:'700',fontFamily:'HindSiliguriMedium'},catBadge:{alignSelf:'flex-start',marginTop:8,borderRadius:8,paddingVertical:4,paddingHorizontal:10},catBadgeText:{fontSize:11,fontWeight:'700'},profile:{padding:15,borderRadius:20,borderWidth:1,flexDirection:'row',alignItems:'center',gap:12},profileName:{fontSize:18,fontWeight:'900'},group:{fontSize:11,fontWeight:'900',letterSpacing:1,marginTop:15,marginBottom:8},menu:{minHeight:61,borderBottomWidth:1,paddingHorizontal:11,flexDirection:'row',alignItems:'center',gap:11},menuIcon:{width:37,height:37,borderRadius:12,alignItems:'center',justifyContent:'center'},languageBox:{borderWidth:1,borderRadius:18,padding:15},languageRow:{height:52,borderBottomWidth:1,flexDirection:'row',alignItems:'center',gap:12},radio:{width:20,height:20,borderRadius:10,borderWidth:2,alignItems:'center',justifyContent:'center'},radioDot:{width:10,height:10,borderRadius:5},back:{height:48,flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:18},backTitle:{fontSize:19,fontWeight:'900'},search:{height:53,borderWidth:1,borderRadius:17,paddingHorizontal:14,flexDirection:'row',alignItems:'center',gap:10},notifCard:{flexDirection:'row',gap:12,borderRadius:16,borderWidth:1,padding:14,marginBottom:10},notifIconWrap:{width:44,height:44,borderRadius:14,alignItems:'center',justifyContent:'center'},notifTitle:{fontSize:14,fontWeight:'800',flex:1,marginRight:8},notifBody:{fontSize:12,marginTop:4,lineHeight:18},notifTime:{fontSize:10,fontWeight:'700',marginTop:6},notifLiveDot:{width:8,height:8,borderRadius:4},notifLink:{flexDirection:'row',alignItems:'center',gap:3,borderWidth:1,borderRadius:6,paddingHorizontal:6,paddingVertical:2},badge:{position:'absolute',top:-5,right:-7,minWidth:18,height:18,borderRadius:9,alignItems:'center',justifyContent:'center',paddingHorizontal:4},badgeText:{color:'#fff',fontSize:10,fontWeight:'900'},detailTop:{height:245,borderRadius:21,alignItems:'center',justifyContent:'center',marginBottom:20},detailTitle:{fontSize:27,fontWeight:'900',lineHeight:35},meta:{flexDirection:'row',gap:17,marginTop:10},actions:{flexDirection:'row',justifyContent:'space-around',marginVertical:20},action:{width:43,height:43,borderRadius:14,borderWidth:1,alignItems:'center',justifyContent:'center'},button:{height:54,borderRadius:16,backgroundColor:'#087A63',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,marginTop:14},buttonText:{color:'#fff',fontWeight:'900',fontSize:15},chapter:{minHeight:66,borderBottomWidth:1,flexDirection:'row',alignItems:'center',gap:12},number:{width:38,height:38,borderRadius:12,alignItems:'center',justifyContent:'center'},comment:{height:56,borderWidth:1,borderRadius:16,marginTop:20,flexDirection:'row',alignItems:'center',gap:10,paddingHorizontal:15},readerHead:{minHeight:68,paddingHorizontal:18,borderBottomWidth:1,flexDirection:'row',alignItems:'center'},readerBody:{padding:28,paddingTop:45,paddingBottom:110},readerTitle:{fontSize:28,fontWeight:'900',textAlign:'center',marginVertical:16},readerTools:{minHeight:68,borderTopWidth:1,paddingHorizontal:18,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},writer:{backgroundColor:'#124D43',borderRadius:20,padding:20},writerTitle:{color:'#fff',fontSize:22,fontWeight:'900',marginTop:12},story:{height:180,borderWidth:1,borderRadius:17,padding:15,textAlignVertical:'top',marginVertical:12},empty:{alignItems:'center',justifyContent:'center',paddingVertical:55},profileCard:{borderRadius:22,padding:20,alignItems:'center'},avatarBig:{width:68,height:68,borderRadius:22,alignItems:'center',justifyContent:'center'},profileNameBig:{fontSize:22,fontWeight:'900',marginTop:12},profileBadge:{fontSize:12,color:'#91A39E',marginTop:2},profileStats:{flexDirection:'row',marginTop:18,backgroundColor:'rgba(0,0,0,0.04)',borderRadius:14,paddingVertical:12},profileStat:{flex:1,alignItems:'center',gap:4},profileStatNum:{fontSize:20,fontWeight:'900'},profileStatLabel:{fontSize:10,fontWeight:'700',letterSpacing:0.5},menuGroup:{borderRadius:18,overflow:'hidden',marginBottom:10},menuGroupTitle:{fontSize:11,fontWeight:'900',letterSpacing:0.8,marginBottom:8,marginLeft:4},menuItem:{minHeight:54,paddingHorizontal:14,flexDirection:'row',alignItems:'center',gap:12},menuIconBig:{width:38,height:38,borderRadius:12,alignItems:'center',justifyContent:'center'},menuSep:{height:StyleSheet.hairlineWidth,marginLeft:62},nameModal:{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'center',alignItems:'center',padding:24},nameModalBox:{width:'100%',borderRadius:22,padding:24},nameModalTitle:{fontSize:18,fontWeight:'900',marginBottom:4},nameModalHint:{fontSize:12,marginBottom:14},nameInput:{height:52,borderWidth:1.5,borderRadius:14,paddingHorizontal:16,fontSize:16,fontWeight:'700',fontFamily:'HindSiliguriMedium'},nameModalBtns:{flexDirection:'row',gap:10,marginTop:16},nameBtn:{flex:1,height:48,borderRadius:14,alignItems:'center',justifyContent:'center'},nameBtnText:{fontWeight:'900',fontSize:15},gateIcon:{width:120,height:120,borderRadius:30},gateTop:{},langRow2:{flexDirection:'row',gap:8,marginTop:18,justifyContent:'center'},langBtn2:{paddingHorizontal:18,paddingVertical:10,borderRadius:12,borderWidth:1.5}});
const featStyles=StyleSheet.create({
  card:{height:252,borderRadius:26,padding:18,flexDirection:'column',justifyContent:'space-between',overflow:'hidden'},
  top:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',zIndex:2},
  rank:{borderRadius:9,paddingHorizontal:9,paddingVertical:4},
  rankText:{fontSize:11,fontWeight:'900'},
  bm:{width:32,height:32,borderRadius:10,alignItems:'center',justifyContent:'center',borderWidth:1,backgroundColor:'#00000033'},
  row:{flexDirection:'row',alignItems:'flex-end',justifyContent:'space-between',gap:12,zIndex:2},
  left:{flex:1,paddingRight:4},
  tag:{alignSelf:'flex-start',borderRadius:8,paddingHorizontal:9,paddingVertical:3,marginBottom:9},
  tagText:{fontSize:10,fontWeight:'900',letterSpacing:.4},
  title:{color:'#fff',fontSize:21,lineHeight:27,fontWeight:'900'},
  author:{color:'#E1EEEA',fontSize:12,marginTop:4,fontWeight:'600'},
  meta:{flexDirection:'row',alignItems:'center',flexWrap:'wrap',gap:9,marginTop:10},
  metaC:{flexDirection:'row',alignItems:'center',gap:4},
  metaT:{color:'#DCEAE6',fontSize:11,fontWeight:'700'},
  btn:{flexDirection:'row',alignItems:'center',gap:5,borderRadius:10,paddingVertical:7,paddingHorizontal:12,alignSelf:'flex-start',marginTop:12,elevation:3,shadowColor:'#000',shadowOpacity:.22,shadowRadius:7,shadowOffset:{width:0,height:3}},
  btnText:{fontSize:12,fontWeight:'900'},
  coverWrap:{borderRadius:8,elevation:5,shadowColor:'#000',shadowOpacity:.35,shadowRadius:10,shadowOffset:{width:0,height:5}},
  coverImg:{width:118,height:166,borderRadius:10,alignItems:'center',justifyContent:'center',transform:[{rotate:'2deg'}]}
});
