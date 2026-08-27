import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, BackHandler, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Share, StyleSheet, Switch, Text, TextInput, Linking, View, useWindowDimensions, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { books as bundledBooks, categories as bundledCategories, notices as bundledNotices } from './src/data';
import { initialState, loadState, saveState } from './src/storage';
import { Book, LocalState, Language } from './src/types';
import { copy, CopyKey } from './src/i18n';
import { fetchRemoteBooks, fetchRemoteCategories, fetchRemoteNotifications, trackEvent, getOfflineBooks, getOfflineCategories, getOfflineNotices, fetchFollowedWriters, writerSignup, writerLogin, verifyWriterToken, fetchWriterStats, fetchWriterStories, createWriterStory, updateWriterProfile, followWriter, unfollowWriter, fetchWriterDashboard, fetchWriterNotifications, markWriterNotificationsRead, deleteWriterNotification, submitStoryForReview, updateWriterStory, deleteWriterStory, fetchWriterStoryDetail, createStoryChapter, deleteStoryChapter } from './src/api';
import { pickAndResizeImage } from './src/imageUpload';

type Tab = 'home'|'library'|'categories'|'episodes'|'profile';
type Screen = { type:'main' } | { type:'book', id:string } | { type:'reader', id:string, chapter:number } | { type:'search' } | { type:'notifications' } | { type:'settings' } | { type:'writer' } | { type:'list', title:string, ids:string[] } | { type:'profileDetails' } | { type:'followedWriters' } | { type:'writerProfile', writer:import('./src/types').WriterProfile };
type Theme = {dark:boolean;primary:string;bg:string;card:string;ink:string;muted:string;line:string;tint:string;reader:string};
const I = (name:string) => (Feather.glyphMap as Record<string,unknown>)[name] ? name as keyof typeof Feather.glyphMap : 'bell';

export default function App(){ return <SafeAreaProvider><AppShell/></SafeAreaProvider>; }
function AppShell(){
 const [state,setState]=useState<LocalState>(initialState); const [loaded,setLoaded]=useState(false); const [screen,setScreen]=useState<Screen>({type:'main'}); const [tab,setTab]=useState<Tab>('home'); const [allBooks,setAllBooks]=useState<Book[]>(bundledBooks); const [allCategories,setAllCategories]=useState<[string,string,string,string|null][]>(bundledCategories.map(c=>[c[0],c[1],c[2],null])); const [remoteNotices,setRemoteNotices]=useState<{id:string;title:string;body:string;icon:string;url:string;time:string}[]>([]); const syncRef=useRef(false);
 const theme=themeFor(state.settings.themeId,state.settings.dark);
 useEffect(()=>{loadState().then(v=>{setState(v);setLoaded(true)})},[]); useEffect(()=>{if(loaded)saveState(state)},[state,loaded]);
 useEffect(()=>{const sub=BackHandler.addEventListener('hardwareBackPress',()=>{if(screen.type!=='main'){setScreen({type:'main'});return true}if(tab!=='home'){setTab('home');return true}return false});return()=>sub.remove()},[screen,tab]);
 const syncRemote=useCallback(async()=>{if(syncRef.current)return;syncRef.current=true;try{const[remote,cats,notices]=await Promise.all([fetchRemoteBooks(),fetchRemoteCategories(),fetchRemoteNotifications()]);if(remote.length){setAllBooks(remote);if(cats.length)setAllCategories(cats.map(c=>[c.name,c.icon,c.color,c.cover_url||null] as [string,string,string,string|null]));if(notices.length)setRemoteNotices(notices.map(n=>({id:n.id,title:n.title,body:n.body,icon:n.icon||'bell',url:n.url||'',time:n.created_at})));setState(s=>({...s,online:true,remoteBooks:remote,lastSync:new Date().toISOString()}))}else{setState(s=>({...s,online:false}))}}catch{setState(s=>({...s,online:false}))}finally{syncRef.current=false}},[]);
 useEffect(()=>{const id=setInterval(syncRemote,30000);syncRemote();return()=>clearInterval(id)},[syncRemote]);
 const update=(p:Partial<LocalState>)=>setState(s=>({...s,...p})); const open=(id:string)=>{update({history:[id,...state.history.filter(x=>x!==id)].slice(0,20)});setScreen({type:'book',id})}; const read=(id:string,chapter:number)=>setScreen({type:'reader',id,chapter});
 if(!loaded)return <View style={[styles.center,{backgroundColor:theme.bg}]}><Image source={require('./assets/loading-icon.png')} style={{width:120,height:120,borderRadius:30}} resizeMode="contain"/><Text style={[styles.brand,{color:theme.ink,marginTop:16,fontSize:28,fontWeight:'900',letterSpacing:1}]}>Lekhoni Kahini</Text></View>;
 if(!state.name)return <NameGate theme={theme} lang={state.settings.language} onDone={(name,lang)=>{update({name,settings:{...state.settings,language:lang}})}}/>;
 const common={theme,state,update,setScreen,open,read,allBooks,allCategories,remoteNotices}; let body:React.ReactNode;
 if(screen.type==='main')body=<Main {...common} tab={tab} setTab={setTab}/>;
 if(screen.type==='book')body=<Details {...common} book={allBooks.find(b=>b.id===screen.id)||bundledBooks.find(b=>b.id===screen.id)!}/>;
 if(screen.type==='reader')body=<Reader {...common} book={allBooks.find(b=>b.id===screen.id)||bundledBooks.find(b=>b.id===screen.id)!} chapter={screen.chapter}/>;
 if(screen.type==='search')body=<Search {...common}/>; if(screen.type==='notifications')body=<Notifications {...common}/>; if(screen.type==='settings')body=<Settings {...common}/>; if(screen.type==='writer')body=<Writer {...common}/>;
  if(screen.type==='list')body=<BookList {...common} title={screen.title} ids={screen.ids}/>;
  if(screen.type==='profileDetails')body=<ProfileDetails {...common}/>;
  if(screen.type==='followedWriters')body=<FollowedWritersList {...common}/>;
  if(screen.type==='writerProfile')body=<WriterProfileView {...common} writer={screen.writer}/>;
 return <View style={{flex:1,backgroundColor:theme.bg}}><StatusBar style={state.settings.dark?'light':'dark'}/>{body}</View>;
}
type C={theme:Theme;state:LocalState;update:(p:Partial<LocalState>)=>void;setScreen:(s:Screen)=>void;open:(id:string)=>void;read:(id:string,c:number)=>void;allBooks:Book[];allCategories:[string,string,string,string|null][];remoteNotices:{id:string;title:string;body:string;icon:string;url:string;time:string}[]};
const tr=(p:C,key:CopyKey)=>copy(p.state.settings.language,key);
function greet(p:C){const h=new Date().getHours();const key=h<12?'morning':h<17?'afternoon':h<21?'evening':'night';return tr(p,key as CopyKey);}
function Page({children,theme}:{children:React.ReactNode;theme:Theme}){const insets=useSafeAreaInsets();return <ScrollView style={{flex:1,backgroundColor:theme.bg}} contentContainerStyle={{paddingTop:insets.top+12,paddingHorizontal:18,paddingBottom:110}} showsVerticalScrollIndicator={false}>{children}</ScrollView>}
function NameGate({theme,lang,onDone}:{theme:Theme;lang:import('./src/types').Language;onDone:(n:string,l:import('./src/types').Language)=>void}){const[name,setName]=useState('');const[curLang,setCurLang]=useState<import('./src/types').Language>(lang);const langs:[import('./src/types').Language,string][]=[['bn','বাংলা'],['en','English'],['hi','हिन्दी']];const{height}=useWindowDimensions();return <KeyboardAvoidingView style={{flex:1,backgroundColor:theme.bg}} behavior={Platform.OS==='ios'?'padding':'height'}><ScrollView contentContainerStyle={{paddingHorizontal:25,paddingTop:80,paddingBottom:40}} keyboardShouldPersistTaps="handled"><View style={{alignItems:'center',marginBottom:10}}><Image source={require('./assets/adaptive-icon.png')} style={[styles.gateIcon]} resizeMode="contain"/></View><Text style={[styles.eyebrow,{color:theme.primary,textAlign:'center'}]}>{copy(curLang,'welcome')}</Text><Text style={[styles.gateTitle,{color:theme.ink,textAlign:'center'}]}>{copy(curLang,'nameQuestion')}</Text><Text style={[styles.copy,{color:theme.muted,textAlign:'center'}]}>{copy(curLang,'gateHint')}</Text><TextInput autoFocus value={name} onChangeText={setName} placeholder={copy(curLang,'namePlaceholder')} placeholderTextColor={theme.muted} style={[styles.input,{color:theme.ink,backgroundColor:theme.card,borderColor:theme.line}]}/><Button title={copy(curLang,'startBtn')} icon="arrow-right" disabled={!name.trim()} onPress={()=>onDone(name.trim(),curLang)}/><Text style={[styles.note,{color:theme.muted}]}>{copy(curLang,'nameNote')}</Text><View style={styles.langRow2}>{langs.map(([code,label])=><Pressable key={code} onPress={()=>setCurLang(code)} style={[styles.langBtn2,{backgroundColor:curLang===code?theme.primary:theme.card,borderColor:curLang===code?theme.primary:theme.line}]}><Text style={{color:curLang===code?'#fff':theme.ink,fontWeight:'800',fontSize:13}}>{label}</Text></Pressable>)}</View></ScrollView></KeyboardAvoidingView>}
function Main(p:C&{tab:Tab;setTab:(t:Tab)=>void}){
 const {theme,tab,setTab}=p;
 const content=tab==='home'?<Home {...p}/>:tab==='library'?<Library {...p}/>:tab==='categories'?<Categories {...p}/>:tab==='episodes'?<Episodes {...p}/>:<Profile {...p}/>;
 const tabs:[Tab,string,CopyKey][]=[['home','home','home'],['library','book-open','library'],['categories','grid','categories'],['episodes','layers','episodes'],['profile','menu','menu']];
 return <View style={{flex:1}}>{content}<View style={[styles.tabs,{backgroundColor:theme.card,borderTopColor:theme.line}]}>{tabs.map(x=><Pressable key={x[0]} onPress={()=>setTab(x[0])} style={styles.tab}><Feather name={I(x[1])} size={20} color={tab===x[0]?theme.primary:theme.muted}/><Text allowFontScaling={false} numberOfLines={1} style={{fontSize:9,fontWeight:'800',color:tab===x[0]?theme.primary:theme.muted}}>{tr(p,x[2])}</Text></Pressable>)}</View></View>
}
function Header({title,sub,theme,action,onNotif,unreadCount}:{title:string;sub?:string;theme:Theme;action?:React.ReactNode;onNotif?:()=>void;unreadCount?:number}){return <View style={styles.header}><View style={{flex:1,marginRight:12}}><Text numberOfLines={1} style={[styles.title,{color:theme.ink}]}>{title}</Text>{sub&&<Text numberOfLines={1} style={{color:theme.muted,marginTop:4}}>{sub}</Text>}</View><View style={{flexDirection:'row',alignItems:'center',gap:18}}>{action}<Pressable onPress={()=>onNotif?onNotif():null} style={{position:'relative'}}><Feather name="bell" size={20} color={theme.ink}/>{!!unreadCount&&<View style={[styles.badge,{backgroundColor:'#EF4444'}]}><Text style={styles.badgeText}>{unreadCount}</Text></View>}</Pressable></View></View>}
function Home(p:C){const b=p.allBooks[0];const un=p.remoteNotices.filter(n=>!p.state.readNotifications.includes(n.id)).length;return <Page theme={p.theme}><Header title={`${greet(p)}, ${p.state.name}`} sub={tr(p,'choose')} theme={p.theme} onNotif={()=>p.setScreen({type:'notifications'})} unreadCount={un} action={<Pressable onPress={()=>p.setScreen({type:'search'})}><Feather name="search" size={21} color={p.theme.ink}/></Pressable>}/><Pressable onPress={()=>p.open(b.id)} style={[styles.feature,{backgroundColor:b.color}]}><View style={{flex:1}}><Text style={styles.tag}>✦ {tr(p,'popular')}</Text><Text style={styles.featureTitle}>{b.title}</Text><Text style={styles.featureAuthor}>{b.author}</Text><View style={styles.readPill}><Text style={{fontWeight:'900',color:'#173D34'}}>{tr(p,'readNow')} →</Text></View></View><Cover book={b} large/></Pressable><Section title={tr(p,'recent')} theme={p.theme} seeAllText={tr(p,'seeAllText')} action={()=>p.setScreen({type:'list',title:tr(p,'recent'),ids:p.allBooks.slice(0,6).map(x=>x.id)})}/><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:13}}>{p.allBooks.slice(1,5).map(b=><Pressable key={b.id} onPress={()=>p.open(b.id)} style={{width:124}}><Cover book={b}/><Text numberOfLines={2} style={[styles.bookName,{color:p.theme.ink}]}>{b.title}</Text><Text style={{color:p.theme.muted,fontSize:11}}>{b.author}</Text></Pressable>)}</ScrollView><Section title={tr(p,'latest')} theme={p.theme}/>{p.allBooks.slice(0,3).map(b=><Episode key={b.id} book={b} theme={p.theme} onPress={()=>p.read(b.id,b.chapters.length-1)}/>)}</Page>}
function Library(p:C){const ids=[...new Set([...p.state.downloads,...p.state.favorites])];const un=p.remoteNotices.filter(n=>!p.state.readNotifications.includes(n.id)).length;return <Page theme={p.theme}><Header title={tr(p,'library')} sub={tr(p,'librarySub')} theme={p.theme} onNotif={()=>p.setScreen({type:'notifications'})} unreadCount={un}/><View style={styles.grid2}><Link title={tr(p,'downloads')} icon="download-cloud" n={p.state.downloads.length} theme={p.theme} onPress={()=>p.setScreen({type:'list',title:tr(p,'downloads'),ids:p.state.downloads})}/><Link title={tr(p,'favorites')} icon="heart" n={p.state.favorites.length} theme={p.theme} onPress={()=>p.setScreen({type:'list',title:tr(p,'favorites'),ids:p.state.favorites})}/><Link title={tr(p,'history')} icon="clock" n={p.state.history.length} theme={p.theme} onPress={()=>p.setScreen({type:'list',title:tr(p,'history'),ids:p.state.history})}/><Link title={tr(p,'bookmarks')} icon="bookmark" n={p.state.bookmarks.length} theme={p.theme} onPress={()=>Alert.alert(tr(p,'bookmarks'),`${p.state.bookmarks.length}`)}/></View><Section title={tr(p,'collection')} theme={p.theme}/>{ids.length?ids.map(id=>{const b=p.allBooks.find(x=>x.id===id);return b&&<Row key={id} book={b} theme={p.theme} onPress={()=>p.open(id)}/> }):<Empty theme={p.theme}/>}</Page>}
function Categories(p:C){const theme=p.theme;const un=p.remoteNotices.filter(n=>!p.state.readNotifications.includes(n.id)).length;return <Page theme={theme}><Header title={tr(p,'categories')} sub={tr(p,'categoriesSub')} theme={theme} onNotif={()=>p.setScreen({type:'notifications'})} unreadCount={un}/><View style={styles.catGrid}>{p.allCategories.map(c=>{const count=p.allBooks.filter(b=>b.category===c[0]).length;const hasImg=Boolean(c[3]);const bookWord=count===1?'book':tr(p,'books');return <Pressable key={c[0]} onPress={()=>p.setScreen({type:'list',title:c[0],ids:p.allBooks.filter(b=>b.category===c[0]).map(b=>b.id)})} style={styles.catCard}><View style={[styles.catImgWrap]}>{hasImg?<Image source={{uri:c[3]!}} style={styles.catImg}/>:<View style={[styles.catImgFallback,{backgroundColor:c[2]}]}><Text style={{color:'#fff',fontSize:28,fontWeight:'900',opacity:0.5}}>{c[0][0]}</Text></View>}<View style={styles.catImgOverlay}><Text numberOfLines={1} style={styles.catImgName}>{c[0]}</Text></View></View><View style={[styles.catBadge,{backgroundColor:theme.tint}]}><Text style={[styles.catBadgeText,{color:theme.primary}]}>{count} {bookWord}</Text></View></Pressable>})}</View></Page>}
function Episodes(p:C){const un=p.remoteNotices.filter(n=>!p.state.readNotifications.includes(n.id)).length;return <Page theme={p.theme}><Header title={tr(p,'episodes')} sub={tr(p,'episodesSub')} theme={p.theme} onNotif={()=>p.setScreen({type:'notifications'})} unreadCount={un}/>{p.allBooks.map((b,i)=><Episode key={b.id} book={b} theme={p.theme} onPress={()=>p.read(b.id,(i+2)%b.chapters.length)}/>)}</Page>}
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
      <View style={{width:42,height:42,borderRadius:21,backgroundColor:t.tint,alignItems:'center',justifyContent:'center'}}>
        <Text style={{fontSize:18,fontWeight:'900',color:t.primary}}>{p.state.name[0]?.toUpperCase()||'?'}</Text>
      </View>
      <View style={{flex:1,marginLeft:12}}>
        <Text numberOfLines={1} style={{fontSize:15,fontWeight:'800',color:t.ink}}>{p.state.name}</Text>
        <Text style={{fontSize:11,color:t.muted,marginTop:1}}>{tr(p,'regularReader')}</Text>
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
          <Text style={{fontSize:13,fontWeight:'800',color:t.ink}}>{tr(p,'readingStreak')}</Text>
          <Text style={{fontSize:10,color:t.muted,marginTop:1}}>{tr(p,'keepItUp')}</Text>
        </View>
        <View style={{alignItems:'center',backgroundColor:t.card,borderRadius:10,paddingHorizontal:10,paddingVertical:5,borderWidth:1,borderColor:t.line}}>
          <Animated.Text style={{fontSize:20,fontWeight:'900',color:t.primary}}>{counterDisplay}</Animated.Text>
          <Text style={{fontSize:8,fontWeight:'800',color:t.muted,marginTop:-2}}>{tr(p,'days')}</Text>
        </View>
      </View>
      <View style={{flexDirection:'row',justifyContent:'space-between',marginTop:10,paddingHorizontal:2}}>
        {[0,1,2,3,4,5,6].map(i=>{const d=new Date();d.setDate(d.getDate()-6+i);const k=d.toISOString().slice(0,10);const active=Boolean(p.state.readingActivity[k]?.episodes);const today=new Date().toISOString().slice(0,10);const isToday=k===today;return <Animated.View key={i} style={{alignItems:'center',gap:4,transform:[{scale:streakDots[i]}]}}>
          <View style={{width:24,height:24,borderRadius:12,backgroundColor:active?t.primary:isToday?t.card:`${t.primary}11`,alignItems:'center',justifyContent:'center',borderWidth:isToday?2:0,borderColor:isToday?t.primary:'transparent'}}>
            {active?<Feather name="check" size={10} color="#fff"/>:isToday&&<View style={{width:5,height:5,borderRadius:3,backgroundColor:t.primary}}/>}
          </View>
          <Text style={{fontSize:8,fontWeight:isToday?'800':'600',color:isToday?t.ink:t.muted}}>{dayLabels[i]}</Text>
        </Animated.View>})}
      </View>
    </Animated.View>

    {/* === WEEKLY READING CARD — compact analytics === */}
    <Animated.View style={{opacity:cardFade2,transform:[{translateY:cardFade2.interpolate({inputRange:[0,1],outputRange:[10,0]})}],backgroundColor:t.card,borderRadius:12,paddingHorizontal:12,paddingTop:10,paddingBottom:10,marginBottom:12,borderWidth:1,borderColor:t.line}}>
      <View style={{flexDirection:'row',alignItems:'center',marginBottom:8}}>
        <Feather name="bar-chart-2" size={12} color={t.primary}/>
        <Text style={{fontSize:11,fontWeight:'800',color:t.ink,marginLeft:6}}>{tr(p,'yourReading')}</Text>
        <Text style={{fontSize:9,color:t.muted,marginLeft:'auto'}}>{tr(p,'weekSummary')}</Text>
      </View>
      <View style={{flexDirection:'row',gap:6,marginBottom:8}}>
        <View style={{flex:1,flexDirection:'row',alignItems:'center',gap:6,backgroundColor:`${t.primary}08`,borderRadius:8,paddingHorizontal:10,paddingVertical:6}}>
          <Feather name="clock" size={12} color={t.primary}/>
          <View>
            <Text style={{fontSize:15,fontWeight:'900',color:t.primary,lineHeight:17}}>{weekMins}</Text>
            <Text style={{fontSize:8,fontWeight:'600',color:t.muted}}>{tr(p,'minRead')}</Text>
          </View>
        </View>
        <View style={{flex:1,flexDirection:'row',alignItems:'center',gap:6,backgroundColor:`${t.primary}08`,borderRadius:8,paddingHorizontal:10,paddingVertical:6}}>
          <Feather name="book-open" size={12} color={t.primary}/>
          <View>
            <Text style={{fontSize:15,fontWeight:'900',color:t.primary,lineHeight:17}}>{weekEps}</Text>
            <Text style={{fontSize:8,fontWeight:'600',color:t.muted}}>{tr(p,'episodesDone')}</Text>
          </View>
        </View>
      </View>
      <View style={{flexDirection:'row',alignItems:'flex-end',justifyContent:'space-between',height:30,paddingHorizontal:1}}>
        {[0,1,2,3,4,5,6].map(i=>{const d=new Date();d.setDate(d.getDate()-6+i);const k=d.toISOString().slice(0,10);const m=p.state.readingActivity[k]?.minutes||0;const h=Math.max(2,Math.round(m/maxBar*24));const today=new Date().toISOString().slice(0,10);const isToday=k===today;return <Animated.View key={i} style={{alignItems:'center',flex:1,justifyContent:'flex-end',gap:2,transform:[{scaleY:weekBars[i]}]}}>
          <View style={{width:'55%',height:h,backgroundColor:m?t.primary:isToday?`${t.primary}15`:`${t.primary}08`,borderRadius:2,minHeight:2}}/>
          <Text style={{fontSize:7,fontWeight:isToday?'800':'500',color:isToday?t.primary:t.muted}}>{dayLabels[i]}</Text>
        </Animated.View>})}
      </View>
    </Animated.View>

    <Pressable onPress={()=>p.setScreen({type:'writer'})} style={{flexDirection:'row',alignItems:'center',backgroundColor:t.card,borderRadius:14,padding:12,marginBottom:8,borderWidth:1,borderColor:t.line}}>
      {p.state.writer?.avatar_url?<Image source={{uri:p.state.writer.avatar_url}} style={{width:42,height:42,borderRadius:21}}/>:<View style={{width:42,height:42,borderRadius:21,backgroundColor:p.state.writer?t.primary:t.tint,alignItems:'center',justifyContent:'center'}}>
        {p.state.writer?<Text style={{fontSize:18,fontWeight:'900',color:'#fff'}}>{p.state.writer.writer_name[0]?.toUpperCase()||'?'}</Text>:<Feather name="edit-3" size={18} color={t.primary}/>}
      </View>}
      <View style={{flex:1,marginLeft:12}}>
        <Text numberOfLines={1} style={{fontSize:15,fontWeight:'800',color:t.ink}}>{p.state.writer?p.state.writer.writer_name:tr(p,'writer')}</Text>
        <Text style={{fontSize:11,color:t.muted,marginTop:1}}>{p.state.writer?tr(p,'writerStudio'):tr(p,'writerStudioSub')}</Text>
      </View>
      <Feather name="chevron-right" size={18} color={t.muted}/>
    </Pressable>

    <Pressable onPress={()=>p.setScreen({type:'followedWriters'})} style={{flexDirection:'row',alignItems:'center',backgroundColor:t.card,borderRadius:14,padding:12,marginBottom:12,borderWidth:1,borderColor:t.line}}>
      <View style={{width:42,height:42,borderRadius:21,backgroundColor:t.tint,alignItems:'center',justifyContent:'center'}}>
        <Feather name="users" size={18} color={t.primary}/>
      </View>
      <View style={{flex:1,marginLeft:12}}>
        <Text numberOfLines={1} style={{fontSize:15,fontWeight:'800',color:t.ink}}>{tr(p,'followedWriters')}</Text>
        <Text style={{fontSize:11,color:t.muted,marginTop:1}}>{p.state.followedWriters.length} {tr(p,'writers')}</Text>
      </View>
      <Feather name="chevron-right" size={18} color={t.muted}/>
    </Pressable>

    <Pressable onPress={()=>p.setScreen({type:'settings'})} style={{flexDirection:'row',alignItems:'center',backgroundColor:t.card,borderRadius:14,padding:12,marginBottom:12,borderWidth:1,borderColor:t.line}}>
      <View style={{width:42,height:42,borderRadius:21,backgroundColor:t.tint,alignItems:'center',justifyContent:'center'}}>
        <Feather name="settings" size={18} color={t.primary}/>
      </View>
      <View style={{flex:1,marginLeft:12}}>
        <Text numberOfLines={1} style={{fontSize:15,fontWeight:'800',color:t.ink}}>{tr(p,'settings')}</Text>
        <Text style={{fontSize:11,color:t.muted,marginTop:1}}>{tr(p,'theme')}, {tr(p,'language')}</Text>
      </View>
      <Feather name="chevron-right" size={18} color={t.muted}/>
    </Pressable>

    <Text style={[styles.menuGroupTitle,{color:t.muted}]}>{tr(p,'aboutApp')}</Text>
    <View style={[styles.menuGroup,{backgroundColor:t.card}]}>
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
  const favs=p.state.favorites.length;
  const downs=p.state.downloads.length;
  const hist=p.state.history.length;
  const favBooks=p.state.favorites.map(id=>p.allBooks.find(b=>b.id===id)).filter(Boolean) as Book[];
  const downBooks=p.state.downloads.map(id=>p.allBooks.find(b=>b.id===id)).filter(Boolean) as Book[];
  const histBooks=p.state.history.map(id=>p.allBooks.find(b=>b.id===id)).filter(Boolean) as Book[];
  const [editing,setEditing]=useState(false);
  const [nameInput,setNameInput]=useState(p.state.name);

  const sections:{title:string;icon:string;count:number;books:Book[];ids:string[]}[]=[
    {title:tr(p,'favorites'),icon:'heart',count:favs,books:favBooks,ids:p.state.favorites},
    {title:tr(p,'downloads'),icon:'download',count:downs,books:downBooks,ids:p.state.downloads},
    {title:tr(p,'history'),icon:'clock',count:hist,books:histBooks,ids:p.state.history},
  ];

  return <Page theme={t}>
    <Back title={tr(p,'guestReader')} theme={t} onPress={()=>p.setScreen({type:'main'})}/>
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={[styles.profileCard,{backgroundColor:t.card}]}>
        <View style={[styles.avatarBig,{backgroundColor:t.tint}]}><Text style={{fontSize:28,fontWeight:'900',color:t.primary}}>{p.state.name[0]?.toUpperCase()||'?'}</Text></View>
        <Text style={[styles.profileNameBig,{color:t.ink}]}>{p.state.name}</Text>
        <Text style={[styles.profileBadge,{color:t.muted}]}>{tr(p,'regularReader')}</Text>
        <View style={[styles.profileStats,{backgroundColor:t.bg}]}>
          <View style={styles.profileStat}><Text style={[styles.profileStatNum,{color:t.primary}]}>{favs}</Text><Text style={[styles.profileStatLabel,{color:t.muted}]}>{tr(p,'favorites')}</Text></View>
          <View style={[styles.profileStat,{borderLeftWidth:1,borderLeftColor:t.line}]}><Text style={[styles.profileStatNum,{color:t.primary}]}>{downs}</Text><Text style={[styles.profileStatLabel,{color:t.muted}]}>{tr(p,'downloads')}</Text></View>
          <View style={[styles.profileStat,{borderLeftWidth:1,borderLeftColor:t.line}]}><Text style={[styles.profileStatNum,{color:t.primary}]}>{hist}</Text><Text style={[styles.profileStatLabel,{color:t.muted}]}>{tr(p,'history')}</Text></View>
        </View>
        <Pressable onPress={()=>{setNameInput(p.state.name);setEditing(true)}} style={{marginTop:10,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,backgroundColor:t.tint,borderRadius:12,paddingHorizontal:14,paddingVertical:8}}>
          <Feather name="edit-2" size={14} color={t.primary}/><Text style={{color:t.primary,fontWeight:'800',fontSize:13}}>{tr(p,'editName')}</Text>
        </Pressable>
      </View>

      {sections.map((sec,idx)=><Pressable key={idx} onPress={()=>{if(sec.ids.length)p.setScreen({type:'list',title:sec.title,ids:sec.ids})}} style={[styles.menuGroup,{backgroundColor:t.card,marginBottom:10}]}>
        <View style={{flexDirection:'row',alignItems:'center',paddingVertical:14,paddingHorizontal:16}}>
          <View style={{width:36,height:36,borderRadius:10,backgroundColor:t.tint,alignItems:'center',justifyContent:'center'}}>
            <Feather name={sec.icon as any} size={17} color={t.primary}/>
          </View>
          <View style={{flex:1,marginLeft:12}}>
            <Text style={{fontSize:14,fontWeight:'800',color:t.ink}}>{sec.title}</Text>
            <Text style={{fontSize:11,color:t.muted,marginTop:1}}>{sec.count} {tr(p,'books')}</Text>
          </View>
          <Feather name="chevron-right" size={18} color={t.muted}/>
        </View>
      </Pressable>)}
    </ScrollView>

    {editing&&<Pressable onPress={()=>setEditing(false)} style={styles.nameModal}><Pressable onPress={()=>{}} style={[styles.nameModalBox,{backgroundColor:t.card}]}><Text style={[styles.nameModalTitle,{color:t.ink}]}>{tr(p,'editName')}</Text><Text style={[styles.nameModalHint,{color:t.muted}]}>{tr(p,'editNameHint')}</Text><TextInput autoFocus value={nameInput} onChangeText={v=>setNameInput(v.slice(0,20))} placeholder={tr(p,'regularReader')} placeholderTextColor={t.muted} style={[styles.nameInput,{color:t.ink,backgroundColor:t.bg,borderColor:t.line}]}/><View style={styles.nameModalBtns}><Pressable onPress={()=>setEditing(false)} style={[styles.nameBtn,{backgroundColor:t.bg}]}><Text style={{color:t.muted,fontWeight:'900'}}>{tr(p,'cancel')}</Text></Pressable><Pressable onPress={()=>{if(nameInput.trim()){p.update({name:nameInput.trim()});setEditing(false)}}} style={[styles.nameBtn,{backgroundColor:t.primary}]}><Text style={{color:'#fff',fontWeight:'900'}}>{tr(p,'save')}</Text></Pressable></View></Pressable></Pressable>}
  </Page>}

function FollowedWritersList(p:C){
  const t=p.theme;
  const writers=p.state.followedWriters;
  const toggleFollow=(wid:string)=>{
    const isFollowed=p.state.followedWriters.some(w=>w.id===wid);
    if(isFollowed){
      unfollowWriter(p.state.deviceId,wid);
      p.update({followedWriters:p.state.followedWriters.filter(w=>w.id!==wid)});
    }else{
      const w=writers.find(x=>x.id===wid);
      if(w)followWriter(p.state.deviceId,wid);
    }
  };
  return <Page theme={t}>
    <Back title={tr(p,'followedWriters')} theme={t} onPress={()=>p.setScreen({type:'main'})}/>
    {writers.length===0?
      <View style={{alignItems:'center',paddingVertical:60}}>
        <View style={{width:60,height:60,borderRadius:30,backgroundColor:t.tint,alignItems:'center',justifyContent:'center',marginBottom:14}}>
          <Feather name="users" size={26} color={t.muted}/>
        </View>
        <Text style={{fontSize:14,fontWeight:'700',color:t.muted,textAlign:'center'}}>{tr(p,'noFollowedWriters')}</Text>
      </View>
    :<ScrollView showsVerticalScrollIndicator={false}>
      {writers.map(w=><Pressable key={w.id} onPress={()=>p.setScreen({type:'writerProfile',writer:w})} style={{flexDirection:'row',alignItems:'center',backgroundColor:t.card,borderRadius:14,padding:12,marginBottom:8,borderWidth:1,borderColor:t.line}}>
        <View style={{width:44,height:44,borderRadius:22,backgroundColor:t.primary,alignItems:'center',justifyContent:'center'}}>
          <Text style={{fontSize:18,fontWeight:'900',color:'#fff'}}>{w.writer_name[0]?.toUpperCase()||'?'}</Text>
        </View>
        <View style={{flex:1,marginLeft:12}}>
          <Text numberOfLines={1} style={{fontSize:14,fontWeight:'800',color:t.ink}}>{w.writer_name}</Text>
          <Text style={{fontSize:11,color:t.muted,marginTop:1}}>@{w.username}{w.follower_count?` · ${w.follower_count} ${tr(p,'followers')}`:''}</Text>
        </View>
        <Pressable onPress={()=>toggleFollow(w.id)} style={{paddingHorizontal:14,paddingVertical:7,borderRadius:10,backgroundColor:t.tint}}>
          <Text style={{fontSize:12,fontWeight:'800',color:t.primary}}>{tr(p,'unfollow')}</Text>
        </Pressable>
      </Pressable>)}
    </ScrollView>}
  </Page>}

function WriterProfileView(p:C&{writer:import('./src/types').WriterProfile}){
  const t=p.theme;
  const w=p.writer;
  const isFollowed=p.state.followedWriters.some(x=>x.id===w.id);
  const writerBooks=p.allBooks.filter(b=>b.author===w.writer_name);
  const toggleFollow=()=>{
    if(isFollowed){
      unfollowWriter(p.state.deviceId,w.id);
      p.update({followedWriters:p.state.followedWriters.filter(x=>x.id!==w.id)});
    }else{
      followWriter(p.state.deviceId,w.id);
      p.update({followedWriters:[...p.state.followedWriters,w]});
    }
  };
  return <Page theme={t}>
    <Back title={w.writer_name} theme={t} onPress={()=>p.setScreen({type:'followedWriters'})}/>
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={{alignItems:'center',marginBottom:24}}>
        <View style={{width:72,height:72,borderRadius:36,backgroundColor:t.primary,alignItems:'center',justifyContent:'center',marginBottom:10,elevation:4,shadowColor:t.primary,shadowOffset:{width:0,height:4},shadowOpacity:0.3,shadowRadius:8}}>
          <Text style={{fontSize:30,fontWeight:'900',color:'#fff'}}>{w.writer_name[0]?.toUpperCase()||'?'}</Text>
        </View>
        <Text style={{fontSize:20,fontWeight:'900',color:t.ink}}>{w.writer_name}</Text>
        <Text style={{fontSize:13,color:t.muted,marginTop:2}}>@{w.username}</Text>
        {w.bio?<Text style={{fontSize:13,color:t.muted,marginTop:6,textAlign:'center',lineHeight:20,maxWidth:280}}>{w.bio}</Text>:null}
        {w.follower_count?<Text style={{fontSize:12,color:t.muted,marginTop:8}}>{w.follower_count} {tr(p,'followers')}</Text>:null}
        <Pressable onPress={toggleFollow} style={{marginTop:14,paddingHorizontal:28,paddingVertical:10,borderRadius:12,backgroundColor:isFollowed?t.tint:t.primary,borderWidth:isFollowed?1:0,borderColor:t.line}}>
          <Text style={{fontSize:14,fontWeight:'800',color:isFollowed?t.primary:'#fff'}}>{isFollowed?tr(p,'unfollow'):tr(p,'follow')}</Text>
        </Pressable>
      </View>
      {writerBooks.length>0&&<>
        <Text style={{fontSize:14,fontWeight:'800',color:t.ink,marginBottom:10}}>{tr(p,'storiesBy')} {w.writer_name}</Text>
        {writerBooks.map(b=><Row key={b.id} book={b} theme={t} onPress={()=>p.open(b.id)}/>)}
      </>}
    </ScrollView>
  </Page>}

function Search(p:C){const [q,setQ]=useState('');const result=q?p.allBooks.filter(b=>`${b.title}${b.author}${b.category}`.includes(q)):p.allBooks.slice(0,3);return <Page theme={p.theme}><Back title="অনুসন্ধান" theme={p.theme} onPress={()=>p.setScreen({type:'main'})}/><View style={[styles.search,{backgroundColor:p.theme.card,borderColor:p.theme.line}]}><Feather name="search" size={18} color={p.theme.muted}/><TextInput autoFocus value={q} onChangeText={setQ} placeholder="বই, লেখক বা বিভাগ খুঁজুন" placeholderTextColor={p.theme.muted} style={{flex:1,color:p.theme.ink}}/></View><Text style={[styles.group,{color:p.theme.muted}]}>{q?`${result.length}টি ফলাফল`:'জনপ্রিয় এখন'}</Text>{result.map(b=><Row key={b.id} book={b} theme={p.theme} onPress={()=>{p.update({searchHistory:[q,...p.state.searchHistory.filter(x=>x!==q)].filter(Boolean)});p.open(b.id)}}/>)}{!result.length&&<Empty theme={p.theme}/>}</Page>}
function Notifications(p:C){const [expanded,setExpanded]=useState<Record<string,boolean>>({});const toggle=(id:string)=>setExpanded(e=>({...e,[id]:!e[id]}));const allNotices=p.remoteNotices.map(n=>({id:n.id,title:n.title,body:n.body,icon:n.icon,url:n.url,time:n.time}));const iconBg=p.theme.primary+'22';const list=allNotices.map(n=>{const isRead=p.state.readNotifications.includes(n.id);const isExpanded=Boolean(expanded[n.id]);const hasLink=Boolean(n.url&&n.url.trim());const openLink=()=>{let u=n.url.trim();if(u&&!/^https?:\/\//i.test(u))u='https://'+u;Linking.openURL(u).catch(()=>{})};const needsExpand=n.body.length>80;return <Pressable key={n.id} onPress={()=>{p.update({readNotifications:[...new Set([...p.state.readNotifications,n.id])]});if(needsExpand)toggle(n.id);}} style={[styles.notifCard,{backgroundColor:isRead?p.theme.card:p.theme.tint,borderColor:p.theme.line,borderLeftColor:isRead?p.theme.line:p.theme.primary,borderLeftWidth:isRead?1:3}]}><View style={[styles.notifIconWrap,{backgroundColor:isRead?p.theme.line:iconBg}]}><Feather name={I(n.icon)} size={20} color={isRead?p.theme.muted:p.theme.primary}/></View><View style={{flex:1}}><View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Text numberOfLines={1} style={[styles.notifTitle,{color:isRead?p.theme.muted:p.theme.ink}]}>{n.title}</Text><View style={{flexDirection:'row',alignItems:'center',gap:6}}>{hasLink&&<Pressable onPress={openLink} style={[styles.notifLink,{borderColor:p.theme.primary}]}><Feather name="external-link" size={10} color={p.theme.primary}/><Text style={{color:p.theme.primary,fontSize:10,fontWeight:'700'}}>{tr(p,'openLink')}</Text></Pressable>}{!isRead&&<View style={[styles.notifLiveDot,{backgroundColor:p.theme.primary}]}/>}</View></View><Text numberOfLines={isExpanded?undefined:2} style={[styles.notifBody,{color:p.theme.muted}]}>{n.body}</Text><Text style={[styles.notifTime,{color:isRead?p.theme.line:p.theme.primary,marginTop:6}]}>{n.time}</Text></View></Pressable>});return <Page theme={p.theme}><Back title={tr(p,'notificationsTitle')} theme={p.theme} onPress={()=>p.setScreen({type:'main'})}/>{list.length?list:<View style={{alignItems:'center',justifyContent:'center',minHeight:400}}><Feather name="bell-off" size={32} color={p.theme.line}/><Text style={{color:p.theme.muted,marginTop:10}}>{tr(p,'noNotifications')}</Text></View>}</Page>}
function BookList(p:C&{title:string;ids:string[]}){return <Page theme={p.theme}><Back title={p.title} theme={p.theme} onPress={()=>p.setScreen({type:'main'})}/><Text style={{color:p.theme.muted,marginBottom:15}}>{p.ids.length}টি বই</Text>{p.ids.length?p.ids.map(id=>{const b=p.allBooks.find(x=>x.id===id);return b&&<Row key={id} book={b} theme={p.theme} onPress={()=>p.open(id)}/>}):<Empty theme={p.theme}/>}</Page>}
function Details(p:C&{book:Book}){const b=p.book,fav=p.state.favorites.includes(b.id),down=p.state.downloads.includes(b.id);const toggle=(key:'favorites'|'downloads',id:string)=>p.update({[key]:p.state[key].includes(id)?p.state[key].filter(x=>x!==id):[...p.state[key],id]});return <Page theme={p.theme}><Back title={tr(p,'details')} theme={p.theme} onPress={()=>p.setScreen({type:'main'})}/><View style={[styles.detailTop,{backgroundColor:b.color}]}><Cover book={b} large/></View><Text style={[styles.detailTitle,{color:p.theme.ink}]}>{b.title}</Text><Text style={{color:p.theme.primary,fontWeight:'800'}}>{b.author}</Text><View style={styles.meta}><Text style={{color:p.theme.muted}}>◉ {b.views} {tr(p,'timesViewed')}</Text><Text style={{color:p.theme.muted}}>★ {b.rating}</Text><Text style={{color:p.theme.muted}}>{b.chapters.length} {tr(p,'chapters')}</Text></View><View style={styles.actions}><Action icon="thumbs-up" label={tr(p,'like')} active={p.state.reactions[b.id]==='like'} theme={p.theme} onPress={()=>p.update({reactions:{...p.state.reactions,[b.id]:'like'}})}/><Action icon="thumbs-down" label={tr(p,'dislike')} active={p.state.reactions[b.id]==='dislike'} theme={p.theme} onPress={()=>p.update({reactions:{...p.state.reactions,[b.id]:'dislike'}})}/><Action icon="heart" label={tr(p,'fav')} active={fav} theme={p.theme} onPress={()=>toggle('favorites',b.id)}/><Action icon={down?'check':'download'} label={down?tr(p,'downloaded'):tr(p,'downloadIt')} active={down} theme={p.theme} onPress={()=>{toggle('downloads',b.id);Alert.alert(down?'saved':'downloaded')}}/></View><Button title={tr(p,'startReading')} icon="book-open" onPress={()=>p.read(b.id,0)}/><Section title={tr(p,'summary')} theme={p.theme}/><Text style={{color:p.theme.muted,lineHeight:23}}>{b.description}</Text><Section title={tr(p,'chapters')} theme={p.theme}/>{b.chapters.map((c,i)=><Pressable key={c.id} onPress={()=>p.read(b.id,i)} style={[styles.chapter,{borderBottomColor:p.theme.line}]}><View style={[styles.number,{backgroundColor:p.theme.tint}]}><Text style={{color:p.theme.primary,fontWeight:'900'}}>{i+1}</Text></View><View style={{flex:1}}><Text style={[styles.rowTitle,{color:p.theme.ink}]}>{c.title}</Text><Text style={{color:p.theme.muted,fontSize:11}}>{c.minutes} {tr(p,'mins')}</Text></View><Feather name="chevron-right" size={18} color={p.theme.muted}/></Pressable>)}<Pressable onPress={()=>Share.share({message:`${b.title} - ${b.author}`})} style={[styles.comment,{borderColor:p.theme.line}]}><Feather name="share-2" size={18} color={p.theme.primary}/><Text style={{color:p.theme.ink,fontWeight:'800'}}>{tr(p,'shareBook')}</Text></Pressable></Page>}
function Reader(p:C&{book:Book;chapter:number}){const insets=useSafeAreaInsets();const {width}=useWindowDimensions();const c=p.book.chapters[p.chapter],key=c.id,progress=p.state.positions[key]||0;
useEffect(()=>{const today=new Date().toISOString().slice(0,10);const prev=p.state.readingActivity[today]||{minutes:0,episodes:0};if(!prev.episodes||!prev.minutes){p.update({readingActivity:{...p.state.readingActivity,[today]:{minutes:prev.minutes+(c.minutes||5),episodes:prev.episodes+1}}})}},[c.id]);
const change=(patch:Partial<LocalState['settings']>)=>p.update({settings:{...p.state.settings,...patch}});const readerSize=Math.max(16,Math.min(25,p.state.settings.fontSize));const readerLine=Math.max(readerSize+9,Math.min(40,p.state.settings.lineHeight));const sidePadding=Math.max(18,Math.min(30,Math.round(width*.07)));return <View style={{flex:1,backgroundColor:p.theme.reader}}><View style={[styles.readerHead,{borderBottomColor:p.theme.line,paddingTop:insets.top+8,paddingBottom:10}]}><Pressable hitSlop={10} onPress={()=>p.setScreen({type:'book',id:p.book.id})}><Feather name="arrow-left" size={22} color={p.theme.ink}/></Pressable><View style={{flex:1,marginLeft:16}}><Text allowFontScaling={false} numberOfLines={1} style={{color:p.theme.ink,fontWeight:'900'}}>{c.title}</Text><Text allowFontScaling={false} numberOfLines={1} style={{color:p.theme.muted,fontSize:10}}>{p.book.title}</Text></View><Pressable hitSlop={10} onPress={()=>p.update({bookmarks:p.state.bookmarks.includes(key)?p.state.bookmarks.filter(x=>x!==key):[...p.state.bookmarks,key]})}><Feather name="bookmark" size={21} color={p.state.bookmarks.includes(key)?p.theme.primary:p.theme.ink}/></Pressable></View><ScrollView showsVerticalScrollIndicator={false} onScroll={e=>{const n=e.nativeEvent;const v=Math.round(n.contentOffset.y/Math.max(1,n.contentSize.height-n.layoutMeasurement.height)*100);if(Math.abs(v-progress)>15)p.update({positions:{...p.state.positions,[key]:v}})}} scrollEventThrottle={800} contentContainerStyle={[styles.readerBody,{paddingHorizontal:sidePadding,paddingBottom:insets.bottom+110}]}><Text allowFontScaling={false} style={{color:p.theme.primary,textAlign:'center',fontWeight:'900'}}>অধ্যায় {p.chapter+1}</Text><Text allowFontScaling={false} style={[styles.readerTitle,{color:p.theme.ink,fontSize:Math.min(30,Math.max(25,width*.075))}]}>{c.title}</Text><Text allowFontScaling={false} style={{color:p.theme.ink,fontSize:readerSize,lineHeight:readerLine,maxWidth:680,alignSelf:'center'}}>{c.body}</Text><Text allowFontScaling={false} style={{textAlign:'center',color:p.theme.primary,fontSize:25,marginTop:30}}>❦</Text></ScrollView><View style={[styles.readerTools,{backgroundColor:p.theme.card,borderTopColor:p.theme.line,paddingBottom:Math.max(8,insets.bottom),paddingTop:10}]}><Pressable hitSlop={8} disabled={p.chapter===0} onPress={()=>p.read(p.book.id,p.chapter-1)}><Text allowFontScaling={false} style={{color:p.theme.ink,fontSize:12,fontWeight:'700',opacity:p.chapter===0?.3:1}}>← আগের</Text></Pressable><Pressable hitSlop={8} onPress={()=>change({fontSize:Math.max(15,p.state.settings.fontSize-1)})}><Text allowFontScaling={false} style={{color:p.theme.primary,fontWeight:'900'}}>A−</Text></Pressable><Pressable hitSlop={8} onPress={()=>change({fontSize:Math.min(28,p.state.settings.fontSize+1)})}><Text allowFontScaling={false} style={{color:p.theme.primary,fontWeight:'900'}}>A+</Text></Pressable><Pressable hitSlop={8} onPress={()=>change({dark:!p.state.settings.dark})}><Feather name="moon" size={19} color={p.theme.primary}/></Pressable><Pressable hitSlop={8} disabled={p.chapter===p.book.chapters.length-1} onPress={()=>p.read(p.book.id,p.chapter+1)}><Text allowFontScaling={false} style={{color:p.theme.ink,fontSize:12,fontWeight:'700',opacity:p.chapter===p.book.chapters.length-1?.3:1}}>পরের →</Text></Pressable></View></View>}
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
  ];

  return <Page theme={t}>
    <Back title={tr(p,'settings')} theme={t} onPress={()=>p.setScreen({type:'main'})}/>
    <Text style={[styles.group,{color:t.muted}]}>{tr(p,'theme')}</Text>
    <View style={{flexDirection:'row',flexWrap:'wrap',gap:12,marginBottom:24}}>
      {themes.map(th=>{
        const selected=currentThemeId===th.id;
        const selTheme=themeFor(th.id,false);
        return <Pressable key={th.id} onPress={()=>set({themeId:th.id})} style={{width:'47%',backgroundColor:selTheme.bg,borderRadius:18,padding:16,borderWidth:2,borderColor:selected?t.primary:'transparent',shadowColor:selected?t.primary:'#000',shadowOffset:{width:0,height:selected?4:0},shadowOpacity:selected?0.15:0,shadowRadius:selected?10:0,elevation:selected?4:0}}>
          <View style={{flexDirection:'row',alignItems:'center',gap:10,marginBottom:10}}>
            <View style={{width:28,height:28,borderRadius:14,backgroundColor:selTheme.primary,shadowColor:selTheme.primary,shadowOffset:{width:0,height:2},shadowOpacity:0.3,shadowRadius:4}}/>
            {selected&&<View style={{marginLeft:'auto',width:22,height:22,borderRadius:11,backgroundColor:t.primary,alignItems:'center',justifyContent:'center'}}><Feather name="check" size={13} color="#fff"/></View>}
          </View>
          <Text style={{fontSize:14,fontWeight:'800',color:selTheme.ink}}>{th.nameBn}</Text>
          <Text style={{fontSize:10,color:selTheme.muted,marginTop:2}}>{th.nameEn}</Text>
          <View style={{flexDirection:'row',gap:4,marginTop:10}}>
            {[selTheme.primary,selTheme.bg,selTheme.card,selTheme.tint].map((c,i)=><View key={i} style={{width:14,height:14,borderRadius:7,backgroundColor:c,borderWidth:1,borderColor:selTheme.line}}/>)}
          </View>
        </Pressable>})}
    </View>

    <Text style={[styles.group,{color:t.muted}]}>{tr(p,'appearance')}</Text>
    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',backgroundColor:t.card,borderRadius:18,padding:16,borderWidth:1,borderColor:t.line,marginBottom:24}}>
      <View style={{flexDirection:'row',alignItems:'center',gap:12}}>
        <View style={{width:38,height:38,borderRadius:12,backgroundColor:darkMode?'#1E293B':t.tint,alignItems:'center',justifyContent:'center'}}>
          <Feather name={darkMode?'moon':'sun'} size={18} color={darkMode?'#FCD34D':t.primary}/>
        </View>
        <View>
          <Text style={{fontSize:14,fontWeight:'800',color:t.ink}}>{darkMode?tr(p,'darkMode'):tr(p,'lightMode')}</Text>
          <Text style={{fontSize:11,color:t.muted,marginTop:1}}>{darkMode?tr(p,'darkModeSub'):tr(p,'lightModeSub')}</Text>
        </View>
      </View>
      <Pressable onPress={()=>set({dark:!darkMode})} style={{width:56,height:30,borderRadius:15,backgroundColor:darkMode?t.primary:t.line,alignItems:'center',justifyContent:darkMode?'flex-end':'flex-start',paddingHorizontal:3}}>
        <View style={{width:24,height:24,borderRadius:12,backgroundColor:'#fff',shadowColor:'#000',shadowOffset:{width:0,height:1},shadowOpacity:0.2,shadowRadius:2,elevation:2}}/>
      </Pressable>
    </View>

    <Text style={[styles.group,{color:t.muted}]}>{tr(p,'language')}</Text>
    <View style={[styles.languageBox,{backgroundColor:t.card,borderColor:t.line}]}>
      <Text style={[styles.rowTitle,{color:t.ink}]}>{tr(p,'languageSub')}</Text>
      {([['en','english'],['bn','bangla'],['hi','hindi']] as const).map(([code,key])=>
        <Pressable key={code} onPress={()=>{set({language:code})}} style={[styles.languageRow,{borderBottomColor:t.line}]}>
          <View style={[styles.radio,{borderColor:language===code?t.primary:t.muted}]}>
            {language===code&&<View style={[styles.radioDot,{backgroundColor:t.primary}]}/>}
          </View>
          <Text style={{color:t.ink,fontWeight:language===code?'900':'600'}}>{copy(code,key)}</Text>
          {language===code&&<Text style={{color:t.primary,fontSize:11,marginLeft:'auto'}}>✓</Text>}
        </Pressable>)}
    </View>

    <Text style={[styles.group,{color:t.muted}]}>{tr(p,'readerSize')}</Text>
    <View style={{flexDirection:'row',gap:12,marginBottom:24}}>
      {[{v:17,l:'S'},{v:19,l:'M'},{v:22,l:'L'},{v:25,l:'XL'}].map(s=>
        <Pressable key={s.v} onPress={()=>set({fontSize:s.v,lineHeight:s.v+13})} style={{flex:1,height:44,borderRadius:12,backgroundColor:p.state.settings.fontSize===s.v?t.primary:t.card,borderWidth:1,borderColor:p.state.settings.fontSize===s.v?t.primary:t.line,alignItems:'center',justifyContent:'center'}}>
          <Text style={{fontWeight:'800',fontSize:12,color:p.state.settings.fontSize===s.v?'#fff':t.ink}}>{s.l}</Text>
        </Pressable>)}
    </View>

    <Text style={[styles.group,{color:t.muted}]}>{tr(p,'data')}</Text>
    <Toggle title={tr(p,'newAlerts')} icon="bell" value={p.state.settings.notifications} theme={t} onChange={v=>set({notifications:v})}/>
    <Toggle title={tr(p,'wifi')} icon="wifi" value={p.state.settings.wifiOnly} theme={t} onChange={v=>set({wifiOnly:v})}/>
    <Menu title={tr(p,'sync')} icon="refresh-cw" theme={t} onPress={()=>{trackEvent(p.state.deviceId,'all','view');Alert.alert(tr(p,'sync'),p.state.online?'Content synced successfully.':'Offline — using cached content.')}}/>
    <Menu title={tr(p,'clearSearch')} icon="trash-2" theme={t} onPress={()=>p.update({searchHistory:[]})}/>
  </Page>}
function Writer(p:C){
  const[authTab,setAuthTab]=useState<'login'|'register'>('login');
  const[form,setForm]=useState({username:'',writerName:'',email:'',password:''});
  const[authErr,setAuthErr]=useState('');
  const[loading,setLoading]=useState(false);
  const[studioTab,setStudioTab]=useState<'dashboard'|'stories'|'profile'|'notifications'>('dashboard');
  const[unreadCount,setUnreadCount]=useState(0);
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
    }else{
      if(!form.email.trim()){setAuthErr(tr(p,'allFieldsRequired'));return}
    }
    setLoading(true);setAuthErr('');
    try{
      if(authTab==='register'){
        const w=await writerSignup(form.username.trim(),form.writerName.trim(),form.email.trim(),form.password);
        if(w){p.update({writer:{id:w.writer.id,username:w.writer.username,writer_name:w.writer.writer_name,avatar_url:w.writer.avatar_url||undefined,bio:w.writer.bio||undefined},writerToken:w.token});setForm({username:'',writerName:'',email:'',password:''})}
        else{setAuthErr(tr(p,'accountExists'))}
      }else{
        const w=await writerLogin(form.email.trim(),form.password);
        if(w){p.update({writer:{id:w.writer.id,username:w.writer.username,writer_name:w.writer.writer_name,avatar_url:w.writer.avatar_url||undefined,bio:w.writer.bio||undefined},writerToken:w.token});setForm({username:'',writerName:'',email:'',password:''})}
        else setAuthErr(tr(p,'wrongCredentials'))
      }
    }catch{setAuthErr(tr(p,'networkError'))}finally{setLoading(false)}
  };

  if(!isLoggedIn)return <KeyboardAvoidingView style={{flex:1,backgroundColor:t.bg}} behavior={Platform.OS==='ios'?'padding':'height'}>
    <ScrollView contentContainerStyle={{flexGrow:1,padding:22,paddingTop:60}} keyboardShouldPersistTaps="handled">
    <View style={{backgroundColor:t.primary,borderRadius:24,padding:28,marginBottom:24,alignItems:'center',elevation:4,shadowColor:t.primary,shadowOffset:{width:0,height:6},shadowOpacity:0.25,shadowRadius:12}}>
      <View style={{width:64,height:64,borderRadius:20,backgroundColor:'rgba(255,255,255,0.18)',alignItems:'center',justifyContent:'center',marginBottom:14}}>
        <Feather name="edit-3" size={30} color="#fff"/>
      </View>
      <Text style={{color:'#fff',fontSize:22,fontWeight:'900',textAlign:'center'}}>{tr(p,'welcomeWriter')}</Text>
      <Text style={{color:'rgba(255,255,255,0.75)',fontSize:13,marginTop:6,textAlign:'center',lineHeight:20}}>{tr(p,'storiesWaiting')}</Text>
    </View>
    <View style={{backgroundColor:t.card,borderRadius:20,padding:22,marginBottom:16,elevation:2,shadowColor:'#000',shadowOffset:{width:0,height:2},shadowOpacity:0.06,shadowRadius:8,borderWidth:1,borderColor:t.line}}>
      <View style={{flexDirection:'row',backgroundColor:t.bg,borderRadius:14,padding:4,marginBottom:20}}>
        <Pressable onPress={()=>{setAuthTab('login');setAuthErr('')}} style={{flex:1,borderRadius:12,paddingVertical:12,alignItems:'center',backgroundColor:authTab==='login'?t.primary:'transparent',elevation:authTab==='login'?2:0}}>
          <Text style={{color:authTab==='login'?'#fff':t.muted,fontWeight:'800',fontSize:14}}>{tr(p,'login')}</Text>
        </Pressable>
        <Pressable onPress={()=>{setAuthTab('register');setAuthErr('')}} style={{flex:1,borderRadius:12,paddingVertical:12,alignItems:'center',backgroundColor:authTab==='register'?t.primary:'transparent',elevation:authTab==='register'?2:0}}>
          <Text style={{color:authTab==='register'?'#fff':t.muted,fontWeight:'800',fontSize:14}}>{tr(p,'register')}</Text>
        </Pressable>
      </View>
      {authTab==='register'&&<>
      <View style={{marginBottom:14}}>
        <Text style={{color:t.muted,fontSize:11,fontWeight:'700',marginBottom:6,marginLeft:4}}>{tr(p,'username')}</Text>
        <View style={{flexDirection:'row',alignItems:'center',backgroundColor:t.bg,borderRadius:14,borderWidth:1.5,borderColor:t.line,paddingHorizontal:14,height:50}}>
          <Feather name="at-sign" size={17} color={t.muted} style={{marginRight:10}}/>
          <TextInput value={form.username} onChangeText={v=>setForm({...form,username:v})} placeholder={tr(p,'username')} placeholderTextColor={t.muted+'88'} autoCapitalize="none" style={{flex:1,color:t.ink,fontSize:15,fontWeight:'600'}}/>
        </View>
      </View>
      <View style={{marginBottom:14}}>
        <Text style={{color:t.muted,fontSize:11,fontWeight:'700',marginBottom:6,marginLeft:4}}>{tr(p,'writerName')}</Text>
        <View style={{flexDirection:'row',alignItems:'center',backgroundColor:t.bg,borderRadius:14,borderWidth:1.5,borderColor:t.line,paddingHorizontal:14,height:50}}>
          <Feather name="feather" size={17} color={t.muted} style={{marginRight:10}}/>
          <TextInput value={form.writerName} onChangeText={v=>setForm({...form,writerName:v})} placeholder={tr(p,'writerName')} placeholderTextColor={t.muted+'88'} style={{flex:1,color:t.ink,fontSize:15,fontWeight:'600'}}/>
        </View>
      </View>
      </>}
      <View style={{marginBottom:14}}>
        <Text style={{color:t.muted,fontSize:11,fontWeight:'700',marginBottom:6,marginLeft:4}}>{authTab==='login'?tr(p,'emailOrUsername'):tr(p,'email')}</Text>
        <View style={{flexDirection:'row',alignItems:'center',backgroundColor:t.bg,borderRadius:14,borderWidth:1.5,borderColor:t.line,paddingHorizontal:14,height:50}}>
          <Feather name="user" size={17} color={t.muted} style={{marginRight:10}}/>
          <TextInput value={form.email} onChangeText={v=>setForm({...form,email:v})} placeholder={authTab==='login'?tr(p,'emailOrUsername'):tr(p,'email')} placeholderTextColor={t.muted+'88'} autoCapitalize="none" style={{flex:1,color:t.ink,fontSize:15,fontWeight:'600'}}/>
        </View>
      </View>
      <View style={{marginBottom:authErr?8:18}}>
        <Text style={{color:t.muted,fontSize:11,fontWeight:'700',marginBottom:6,marginLeft:4}}>{tr(p,'password')}</Text>
        <View style={{flexDirection:'row',alignItems:'center',backgroundColor:t.bg,borderRadius:14,borderWidth:1.5,borderColor:t.line,paddingHorizontal:14,height:50}}>
          <Feather name="lock" size={17} color={t.muted} style={{marginRight:10}}/>
          <TextInput value={form.password} onChangeText={v=>setForm({...form,password:v})} placeholder={tr(p,'password')} placeholderTextColor={t.muted+'88'} secureTextEntry style={{flex:1,color:t.ink,fontSize:15,fontWeight:'600'}}/>
        </View>
      </View>
      {authErr?<View style={{backgroundColor:'#FEF2F2',borderRadius:12,padding:12,marginBottom:14,flexDirection:'row',alignItems:'center',gap:8}}><Feather name="alert-circle" size={16} color="#EF4444"/><Text style={{color:'#EF4444',fontSize:13,fontWeight:'600',flex:1}}>{authErr}</Text></View>:null}
      <Pressable disabled={loading} onPress={handleAuth} style={{backgroundColor:t.primary,borderRadius:14,height:52,alignItems:'center',justifyContent:'center',elevation:loading?0:3,shadowColor:t.primary,shadowOffset:{width:0,height:4},shadowOpacity:0.3,shadowRadius:8,opacity:loading?0.6:1}}>
        {loading?<ActivityIndicator color="#fff" size="small"/>:<Text style={{color:'#fff',fontWeight:'900',fontSize:16}}>{authTab==='register'?tr(p,'createAccount'):tr(p,'login')}</Text>}
      </Pressable>
      <Text style={{color:t.muted,fontSize:13,textAlign:'center',marginTop:16}}>
        {authTab==='login'?tr(p,'noAccount'):tr(p,'alreadyAccount')}{' '}
        <Text onPress={()=>{setAuthTab(authTab==='login'?'register':'login');setAuthErr('')}} style={{color:t.primary,fontWeight:'800'}}>
          {authTab==='login'?tr(p,'registerHere'):tr(p,'loginHere')}</Text>
      </Text>
    </View>
    </ScrollView>
  </KeyboardAvoidingView>;

  const tabs:[string,string,string][]=[['dashboard',tr(p,'dashboard'),'bar-chart-2'],['stories',tr(p,'myStories'),'book-open'],['profile',tr(p,'profile'),'user']];

  return <Page theme={t}>
    <View style={{flexDirection:'row',alignItems:'center',backgroundColor:t.card,borderRadius:16,padding:14,marginBottom:16,borderWidth:1,borderColor:t.line}}>
      {p.state.writer?.avatar_url?<Image source={{uri:p.state.writer.avatar_url}} style={{width:48,height:48,borderRadius:24}}/>:<View style={{width:48,height:48,borderRadius:24,backgroundColor:t.primary,alignItems:'center',justifyContent:'center',elevation:3,shadowColor:t.primary,shadowOffset:{width:0,height:3},shadowOpacity:0.25,shadowRadius:6}}>
        <Text style={{fontSize:20,fontWeight:'900',color:'#fff'}}>{p.state.writer?.writer_name?.[0]?.toUpperCase()||'?'}</Text>
      </View>}
      <View style={{flex:1,marginLeft:12}}>
        <Text numberOfLines={1} style={{fontSize:17,fontWeight:'900',color:t.ink}}>{p.state.writer?.writer_name}</Text>
        <Text style={{fontSize:12,color:t.muted,marginTop:1}}>{tr(p,'writerStudio')}</Text>
      </View>
      <Pressable onPress={()=>{setStudioTab('notifications');setUnreadCount(0)}} style={{width:40,height:40,borderRadius:12,backgroundColor:t.tint,alignItems:'center',justifyContent:'center',marginRight:8}}>
        <Feather name="bell" size={18} color={t.primary}/>
        {unreadCount>0&&<View style={{position:'absolute',top:-3,right:-3,backgroundColor:'#EF4444',borderRadius:8,minWidth:16,height:16,alignItems:'center',justifyContent:'center',paddingHorizontal:4}}>
          <Text style={{color:'#fff',fontSize:9,fontWeight:'900'}}>{unreadCount>9?'9+':unreadCount}</Text>
        </View>}
      </Pressable>
      <Pressable onPress={()=>p.update({writer:null,writerToken:null})} style={{width:36,height:36,borderRadius:10,backgroundColor:t.tint,alignItems:'center',justifyContent:'center'}}>
        <Feather name="log-out" size={16} color={t.primary}/>
      </Pressable>
    </View>
    <View style={{flexDirection:'row',gap:5,marginBottom:18}}>
      {tabs.map(([key,label,icon])=><Pressable key={key} onPress={()=>{setStudioTab(key as any);if(key==='notifications')setUnreadCount(0)}} style={{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:4,backgroundColor:studioTab===key?t.primary:t.card,borderRadius:10,paddingVertical:9,borderWidth:1,borderColor:studioTab===key?t.primary:t.line}}>
        <Feather name={icon as any} size={13} color={studioTab===key?'#fff':t.muted}/>
        <Text style={{color:studioTab===key?'#fff':t.muted,fontWeight:'800',fontSize:11}}>{label}</Text>
        {key==='notifications'&&unreadCount>0&&<View style={{backgroundColor:studioTab===key?'rgba(255,255,255,0.3)':'#EF4444',borderRadius:6,minWidth:14,height:14,alignItems:'center',justifyContent:'center',paddingHorizontal:3}}>
          <Text style={{color:'#fff',fontSize:8,fontWeight:'900'}}>{unreadCount>9?'9+':unreadCount}</Text>
        </View>}
      </Pressable>)}
    </View>
    {studioTab==='dashboard'&&<WriterDashboard token={token} theme={t} lang={lang}/>}
    {studioTab==='stories'&&<WriterStories token={token} theme={t} lang={lang} categories={p.allCategories.map(c=>c[0])}/>}
    {studioTab==='profile'&&<WriterProfileStudio token={token} theme={t} writer={p.state.writer} lang={lang} onUpdate={(patch)=>p.update({writer:{...p.state.writer!,...patch}})}/>}
    {studioTab==='notifications'&&<WriterNotifs token={token} theme={t} lang={lang}/>}
  </Page>}

function WriterDashboard({token,theme:t,lang}:{token:string;theme:Theme;lang:Language}){
  const[d,setD]=useState<{stories:number;totalViews:number;followers:number;published:number;pending:number;recent:any[];activities:any[]}>({stories:0,totalViews:0,followers:0,published:0,pending:0,recent:[],activities:[]});
  const[loading,setLoading]=useState(true);
  useEffect(()=>{fetchWriterDashboard(token).then(s=>{if(s)setD(s)}).finally(()=>setLoading(false))},[token]);
  if(loading)return <View style={{alignItems:'center',paddingVertical:60}}><ActivityIndicator size="large" color={t.primary}/></View>;
  const cards:{icon:string;label:string;value:number;bg:string}[]=[
    {icon:'book-open',label:copy(lang,'myStories'),value:d.stories,bg:t.primary},
    {icon:'eye',label:copy(lang,'totalViews'),value:d.totalViews,bg:'#6366F1'},
    {icon:'users',label:copy(lang,'followers'),value:d.followers,bg:'#F59E0B'},
    {icon:'check-circle',label:copy(lang,'publishedStories'),value:d.published,bg:'#10B981'},
  ];
  return <ScrollView showsVerticalScrollIndicator={false}>
    <View style={{flexDirection:'row',flexWrap:'wrap',gap:10,marginBottom:18}}>
      {cards.map((c,i)=><View key={i} style={{width:'47%',backgroundColor:t.card,borderRadius:14,padding:14,borderWidth:1,borderColor:t.line}}>
        <View style={{width:34,height:34,borderRadius:10,backgroundColor:c.bg+'18',alignItems:'center',justifyContent:'center',marginBottom:8}}>
          <Feather name={c.icon as any} size={16} color={c.bg}/>
        </View>
        <Text style={{fontSize:22,fontWeight:'900',color:t.ink}}>{c.value}</Text>
        <Text style={{fontSize:10,fontWeight:'700',color:t.muted,marginTop:2}}>{c.label}</Text>
      </View>)}
    </View>
    {d.pending>0&&<View style={{backgroundColor:'#FEF3C7',borderRadius:12,padding:12,marginBottom:14,flexDirection:'row',alignItems:'center',gap:8}}>
      <Feather name="clock" size={16} color="#D97706"/>
      <Text style={{fontSize:13,fontWeight:'700',color:'#92400E',flex:1}}>{d.pending} {copy(lang,'pendingReview')}</Text>
    </View>}
    <Text style={{fontSize:14,fontWeight:'800',color:t.ink,marginBottom:10}}>{copy(lang,'recentActivity')}</Text>
    {d.recent.length===0?<View style={{backgroundColor:t.card,borderRadius:14,padding:20,alignItems:'center',borderWidth:1,borderColor:t.line}}>
      <Feather name="inbox" size={28} color={t.muted}/><Text style={{fontSize:13,color:t.muted,marginTop:8}}>{copy(lang,'noActivity')}</Text>
    </View>:d.recent.map(s=><View key={s.id} style={{flexDirection:'row',alignItems:'center',backgroundColor:t.card,borderRadius:12,padding:12,marginBottom:6,borderWidth:1,borderColor:t.line}}>
      <View style={{width:8,height:8,borderRadius:4,backgroundColor:s.status==='published'?'#10B981':s.status==='pending'?'#F59E0B':'#9CA3AF',marginRight:10}}/>
      <View style={{flex:1}}><Text numberOfLines={1} style={{fontSize:13,fontWeight:'700',color:t.ink}}>{s.title}</Text><Text style={{fontSize:10,color:t.muted,marginTop:1}}>{s.views} {copy(lang,'views')}</Text></View>
      <Text style={{fontSize:10,fontWeight:'700',color:s.status==='published'?'#10B981':s.status==='pending'?'#D97706':t.muted}}>{copy(lang,s.status)}</Text>
    </View>)}
  </ScrollView>}

function WriterStories({token,theme:t,lang,categories}:{token:string;theme:Theme;lang:Language;categories:string[]}){
  const[stories,setStories]=useState<any[]>([]);
  const[loading,setLoading]=useState(true);
  const[filter,setFilter]=useState<'all'|'published'|'draft'|'pending'|'rejected'>('all');
  const[showNew,setShowNew]=useState(false);
  const[newTitle,setNewTitle]=useState('');
  const[newDesc,setNewDesc]=useState('');
  const[newCover,setNewCover]=useState('');
  const[newCoverPreview,setNewCoverPreview]=useState('');
  const[newCategory,setNewCategory]=useState('');
  const[catOpen,setCatOpen]=useState(false);
  const[expanded,setExpanded]=useState<string|null>(null);
  const[chapters,setChapters]=useState<any[]>([]);
  const[chTitle,setChTitle]=useState('');
  const[chBody,setChBody]=useState('');
  const[chSaving,setChSaving]=useState(false);
  const[saving,setSaving]=useState(false);
  const[uploadingImg,setUploadingImg]=useState(false);
  const load=()=>{fetchWriterStories(token).then(s=>setStories(s||[])).finally(()=>setLoading(false))};
  useEffect(()=>{load()},[token]);
  const filtered=filter==='all'?stories:stories.filter(s=>s.status===filter);
  const statusColor=(s:string)=>s==='published'?'#10B981':s==='pending'?'#F59E0B':s==='rejected'?'#EF4444':'#9CA3AF';
  const pickCover=async()=>{setUploadingImg(true);const url=await pickAndResizeImage('cover');if(url){setNewCover(url);setNewCoverPreview(url)}setUploadingImg(false)};
  const handleCreate=async()=>{
    if(!newTitle.trim())return;setSaving(true);
    const r=await createWriterStory(token,newTitle.trim(),newDesc.trim(),newCategory||(categories[0]||''),newCover||undefined);
    if(r){setStories(s=>[r,...s]);setShowNew(false);setNewTitle('');setNewDesc('');setNewCover('');setNewCoverPreview('');setNewCategory('')}
    setSaving(false);
  };
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
  const handleDelete=async(id:string)=>{Alert.alert('',copy(lang,'cancel')+'?',[{text:copy(lang,'cancel'),style:'cancel'},{text:copy(lang,'delete'),style:'destructive',onPress:async()=>{await deleteWriterStory(token,id);load()}}])};
  return <View style={{flex:1}}>
    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
      <Text style={{fontSize:16,fontWeight:'900',color:t.ink}}>{copy(lang,'myStories')} ({stories.length})</Text>
      <Pressable onPress={()=>setShowNew(!showNew)} style={{backgroundColor:t.primary,borderRadius:10,paddingHorizontal:12,paddingVertical:7,flexDirection:'row',alignItems:'center',gap:5}}>
        <Feather name={showNew?'x':'plus'} size={14} color="#fff"/>
        <Text style={{color:'#fff',fontWeight:'800',fontSize:12}}>{showNew?copy(lang,'cancel'):copy(lang,'newStory')}</Text>
      </Pressable>
    </View>
    <View style={{flexDirection:'row',gap:5,marginBottom:14}}>
      {(['all','published','draft','pending','rejected'] as const).map(f=><Pressable key={f} onPress={()=>setFilter(f)} style={{paddingHorizontal:10,paddingVertical:5,borderRadius:8,backgroundColor:filter===f?t.primary:t.card,borderWidth:1,borderColor:filter===f?t.primary:t.line}}>
        <Text style={{fontSize:11,fontWeight:'700',color:filter===f?'#fff':t.muted}}>{copy(lang,f)}</Text>
      </Pressable>)}
    </View>
    {showNew&&<View style={{backgroundColor:t.card,borderRadius:14,padding:16,marginBottom:14,borderWidth:1,borderColor:t.line}}>
      <TextInput value={newTitle} onChangeText={setNewTitle} placeholder={copy(lang,'storyTitle')} placeholderTextColor={t.muted} style={{color:t.ink,fontSize:15,fontWeight:'700',marginBottom:10,borderBottomWidth:1,borderBottomColor:t.line,paddingBottom:8}}/>
      <TextInput value={newDesc} onChangeText={setNewDesc} multiline placeholder={copy(lang,'description')} placeholderTextColor={t.muted} style={{color:t.ink,fontSize:13,marginBottom:10,minHeight:50,textAlignVertical:'top'}}/>
      <Pressable onPress={pickCover} disabled={uploadingImg} style={{backgroundColor:t.bg,borderRadius:12,borderWidth:1.5,borderColor:t.line,borderStyle:'dashed',padding:uploadingImg?16:12,marginBottom:10,alignItems:'center'}}>
        {uploadingImg?<ActivityIndicator size="small" color={t.primary}/>:
        newCoverPreview?<View style={{flexDirection:'row',alignItems:'center',gap:10}}><Image source={{uri:newCoverPreview}} style={{width:60,height:45,borderRadius:8}}/><View style={{flex:1}}><Text style={{fontSize:12,fontWeight:'700',color:t.ink}}>{copy(lang,'changePhoto')}</Text><Text style={{fontSize:10,color:t.muted,marginTop:2}}>{copy(lang,'tapToUpload')}</Text></View><Feather name="refresh-cw" size={14} color={t.muted}/></View>:
        <View style={{flexDirection:'row',alignItems:'center',gap:8}}><Feather name="image" size={18} color={t.muted}/><Text style={{fontSize:12,color:t.muted,fontWeight:'600'}}>{copy(lang,'tapToUpload')}</Text></View>}
      </Pressable>
      <View style={{marginBottom:12}}>
        <Pressable onPress={()=>setCatOpen(!catOpen)} style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderWidth:1,borderColor:catOpen?t.primary:t.line,borderRadius:8,padding:10,backgroundColor:t.bg}}>
          <Text style={{fontSize:12,fontWeight:'600',color:newCategory?t.ink:t.muted}}>{newCategory||copy(lang,'selectCategory')}</Text>
          <Feather name={catOpen?'chevron-up':'chevron-down'} size={16} color={t.muted}/>
        </Pressable>
        {catOpen&&<View style={{marginTop:6,borderWidth:1,borderColor:t.line,borderRadius:8,backgroundColor:t.card,maxHeight:160,overflow:'hidden'}}>
          <ScrollView nestedScrollEnabled style={{maxHeight:160}}>
            {categories.map(c=><Pressable key={c} onPress={()=>{setNewCategory(c);setCatOpen(false)}} style={{paddingHorizontal:12,paddingVertical:9,borderBottomWidth:1,borderBottomColor:t.line,flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
              <Text style={{fontSize:12,fontWeight:newCategory===c?'800':'500',color:newCategory===c?t.primary:t.ink}}>{c}</Text>
              {newCategory===c&&<Feather name="check" size={14} color={t.primary}/>}
            </Pressable>)}
          </ScrollView>
        </View>}
      </View>
      <Pressable disabled={saving||!newTitle.trim()} onPress={handleCreate} style={{backgroundColor:t.primary,borderRadius:10,paddingVertical:10,alignItems:'center',opacity:saving||!newTitle.trim()?0.5:1}}>
        {saving?<ActivityIndicator color="#fff" size="small"/>:<Text style={{color:'#fff',fontWeight:'800',fontSize:13}}>{copy(lang,'create')}</Text>}
      </Pressable>
    </View>}
    {loading?<View style={{alignItems:'center',paddingVertical:40}}><ActivityIndicator color={t.primary}/></View>:
    filtered.length===0?<View style={{alignItems:'center',paddingVertical:40}}><Feather name="book" size={28} color={t.muted}/><Text style={{fontSize:13,color:t.muted,marginTop:8}}>{copy(lang,'noStories')}</Text></View>:
    filtered.map(s=><View key={s.id} style={{backgroundColor:t.card,borderRadius:14,padding:14,marginBottom:8,borderWidth:1,borderColor:t.line}}>
      <View style={{flexDirection:'row',alignItems:'center',marginBottom:8}}>
        {s.cover_url?<Image source={{uri:s.cover_url}} style={{width:44,height:34,borderRadius:6,marginRight:10}}/>:
        <View style={{width:44,height:34,borderRadius:6,backgroundColor:t.tint,alignItems:'center',justifyContent:'center',marginRight:10}}><Feather name="book-open" size={14} color={t.muted}/></View>}
        <View style={{width:8,height:8,borderRadius:4,backgroundColor:statusColor(s.status),marginRight:8}}/>
        <Text numberOfLines={1} style={{flex:1,fontSize:14,fontWeight:'800',color:t.ink}}>{s.title}</Text>
        <View style={{paddingHorizontal:8,paddingVertical:3,borderRadius:6,backgroundColor:statusColor(s.status)+'18'}}>
          <Text style={{fontSize:10,fontWeight:'700',color:statusColor(s.status)}}>{copy(lang,s.status)}</Text>
        </View>
      </View>
      {s.description?<Text numberOfLines={2} style={{fontSize:12,color:t.muted,marginBottom:8}}>{s.description}</Text>:null}
      <View style={{flexDirection:'row',gap:6}}>
        {s.status==='draft'&&<Pressable onPress={()=>handleSubmit(s.id)} style={{flex:1,backgroundColor:'#FEF3C7',borderRadius:8,paddingVertical:7,alignItems:'center'}}>
          <Text style={{fontSize:11,fontWeight:'700',color:'#D97706'}}>{copy(lang,'submitReview')}</Text>
        </Pressable>}
        {s.status==='rejected'&&<Pressable onPress={()=>handleSubmit(s.id)} style={{flex:1,backgroundColor:'#FEE2E2',borderRadius:8,paddingVertical:7,alignItems:'center'}}>
          <Text style={{fontSize:11,fontWeight:'700',color:'#EF4444'}}>{copy(lang,'submitReview')}</Text>
        </Pressable>}
        <Pressable onPress={()=>toggleExpand(s.id)} style={{width:32,height:32,borderRadius:8,backgroundColor:t.tint,alignItems:'center',justifyContent:'center',marginRight:6}}>
          <Feather name="book-open" size={14} color={expanded===s.id?t.primary:t.muted}/>
        </Pressable>
        <Pressable onPress={()=>handleDelete(s.id)} style={{width:32,height:32,borderRadius:8,backgroundColor:t.tint,alignItems:'center',justifyContent:'center'}}>
          <Feather name="trash-2" size={14} color={t.muted}/>
        </Pressable>
      </View>
      {s.review_note&&<View style={{marginTop:8,backgroundColor:'#FEF2F2',borderRadius:8,padding:8}}>
        <Text style={{fontSize:11,color:'#991B1B',fontWeight:'600'}}>{copy(lang,'reviewNote')}: {s.review_note}</Text>
      </View>}
      {expanded===s.id&&<View style={{marginTop:10,borderTopWidth:1,borderTopColor:t.line,paddingTop:10}}>
        <Text style={{fontSize:12,fontWeight:'800',color:t.ink,marginBottom:6}}>{copy(lang,'chapters')} ({chapters.length})</Text>
        {chapters.map((ch,i)=><View key={ch.id} style={{flexDirection:'row',alignItems:'center',backgroundColor:t.bg,borderRadius:8,padding:8,marginBottom:4}}>
          <View style={{width:22,height:22,borderRadius:11,backgroundColor:t.tint,alignItems:'center',justifyContent:'center',marginRight:8}}>
            <Text style={{fontSize:10,fontWeight:'800',color:t.primary}}>{i+1}</Text>
          </View>
          <Text numberOfLines={1} style={{flex:1,fontSize:12,fontWeight:'600',color:t.ink}}>{ch.title}</Text>
          <Pressable onPress={()=>removeChapter(s.id,ch.id)}><Feather name="x" size={15} color={t.muted}/></Pressable>
        </View>)}
        <TextInput value={chTitle} onChangeText={setChTitle} placeholder={copy(lang,'chapterTitle')} placeholderTextColor={t.muted} style={{color:t.ink,fontSize:13,fontWeight:'700',marginTop:8,borderBottomWidth:1,borderBottomColor:t.line,paddingBottom:6}}/>
        <TextInput value={chBody} onChangeText={setChBody} multiline placeholder={copy(lang,'chapterBody')} placeholderTextColor={t.muted} style={{color:t.ink,fontSize:12,marginTop:8,minHeight:60,textAlignVertical:'top'}}/>
        <Pressable disabled={chSaving||!chTitle.trim()} onPress={()=>addChapter(s.id)} style={{backgroundColor:t.primary,borderRadius:8,paddingVertical:8,alignItems:'center',marginTop:8,opacity:chSaving||!chTitle.trim()?0.5:1}}>
          {chSaving?<ActivityIndicator color="#fff" size="small"/>:<Text style={{color:'#fff',fontWeight:'800',fontSize:12}}>{copy(lang,'addChapter')}</Text>}
        </Pressable>
      </View>}
    </View>)}
  </View>}

function WriterProfileStudio({token,theme:t,writer,lang,onUpdate}:{token:string;theme:Theme;writer:any;lang:Language;onUpdate:(patch:any)=>void}){
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
    if(url)setAvatar(url);
    setUploadingImg(false);
  };
  const handleSave=async()=>{
    setSaving(true);setErr('');
    const r=await updateWriterProfile(token,{writer_name:name.trim(),bio:bio.trim(),avatar_url:avatar||undefined,username:username.trim()||undefined});
    setSaving(false);
    if(r.ok){setSaved(true);onUpdate({writer_name:name.trim(),bio:bio.trim(),avatar_url:avatar||undefined,username:username.trim()||undefined});setTimeout(()=>setSaved(false),2000)}
    else setErr(r.error==='Username already taken'?copy(lang,'usernameTaken'):r.error||'');
  };
  return <ScrollView showsVerticalScrollIndicator={false}>
    <View style={{alignItems:'center',marginBottom:20}}>
      <Pressable onPress={handlePickAvatar} disabled={uploadingImg} style={{marginBottom:10}}>
        {uploadingImg?<View style={{width:80,height:80,borderRadius:40,backgroundColor:t.tint,alignItems:'center',justifyContent:'center'}}><ActivityIndicator size="small" color={t.primary}/></View>:
        avatar?<View><Image source={{uri:avatar}} style={{width:80,height:80,borderRadius:40}}/><View style={{position:'absolute',bottom:0,right:0,backgroundColor:t.primary,borderRadius:12,width:26,height:26,alignItems:'center',justifyContent:'center',borderWidth:2,borderColor:t.card}}><Feather name="camera" size={12} color="#fff"/></View></View>:
        <View style={{width:80,height:80,borderRadius:40,backgroundColor:t.primary,alignItems:'center',justifyContent:'center',elevation:4,shadowColor:t.primary,shadowOffset:{width:0,height:4},shadowOpacity:0.3,shadowRadius:8}}>
          <Text style={{fontSize:28,fontWeight:'900',color:'#fff'}}>{writer?.writer_name?.[0]?.toUpperCase()||'?'}</Text>
          <View style={{position:'absolute',bottom:0,backgroundColor:'rgba(0,0,0,0.4)',borderRadius:12,width:26,height:26,alignItems:'center',justifyContent:'center'}}><Feather name="camera" size={12} color="#fff"/></View>
        </View>}
      </Pressable>
      <Text style={{fontSize:18,fontWeight:'900',color:t.ink}}>{name||writer?.writer_name}</Text>
      <Text style={{fontSize:12,color:t.muted,marginTop:2}}>@{username||writer?.username}</Text>
    </View>
    <View style={{backgroundColor:t.card,borderRadius:14,padding:16,marginBottom:14,borderWidth:1,borderColor:t.line}}>
      <Text style={{fontSize:11,fontWeight:'800',color:t.muted,marginBottom:12,letterSpacing:0.5}}>{copy(lang,'editProfile')}</Text>
      <View style={{marginBottom:12}}>
        <Text style={{color:t.muted,fontSize:11,fontWeight:'700',marginBottom:5,marginLeft:4}}>{copy(lang,'username')}</Text>
        <View style={{flexDirection:'row',alignItems:'center',backgroundColor:t.bg,borderRadius:12,borderWidth:1.5,borderColor:t.line,paddingHorizontal:12,height:44}}>
          <Feather name="at-sign" size={16} color={t.muted} style={{marginRight:8}}/>
          <TextInput value={username} onChangeText={setUsername} autoCapitalize="none" style={{flex:1,color:t.ink,fontSize:14,fontWeight:'600'}}/>
        </View>
      </View>
      <View style={{marginBottom:12}}>
        <Text style={{color:t.muted,fontSize:11,fontWeight:'700',marginBottom:5,marginLeft:4}}>{copy(lang,'writerName')}</Text>
        <View style={{flexDirection:'row',alignItems:'center',backgroundColor:t.bg,borderRadius:12,borderWidth:1.5,borderColor:t.line,paddingHorizontal:12,height:44}}>
          <Feather name="user" size={16} color={t.muted} style={{marginRight:8}}/>
          <TextInput value={name} onChangeText={setName} style={{flex:1,color:t.ink,fontSize:14,fontWeight:'600'}}/>
        </View>
      </View>
      <View style={{marginBottom:16}}>
        <Text style={{color:t.muted,fontSize:11,fontWeight:'700',marginBottom:5,marginLeft:4}}>{copy(lang,'bio')}</Text>
        <View style={{backgroundColor:t.bg,borderRadius:12,borderWidth:1.5,borderColor:t.line,padding:12,minHeight:80}}>
          <TextInput value={bio} onChangeText={setBio} multiline placeholder={copy(lang,'bioPlaceholder')} placeholderTextColor={t.muted+'88'} style={{color:t.ink,fontSize:14,fontWeight:'500',lineHeight:20}}/>
        </View>
      </View>
      {err?<View style={{backgroundColor:'#FEF2F2',borderRadius:10,padding:10,marginBottom:12,flexDirection:'row',alignItems:'center',gap:6}}><Feather name="alert-circle" size={14} color="#EF4444"/><Text style={{fontSize:12,fontWeight:'600',color:'#EF4444',flex:1}}>{err}</Text></View>:null}
      <Pressable disabled={saving} onPress={handleSave} style={{backgroundColor:saved?'#10B981':t.primary,borderRadius:12,paddingVertical:12,alignItems:'center'}}>
        {saving?<ActivityIndicator color="#fff" size="small"/>:<Text style={{color:'#fff',fontWeight:'800',fontSize:14}}>{saved?'✓ '+copy(lang,'saved'):copy(lang,'save')}</Text>}
      </Pressable>
    </View>
  </ScrollView>}

function WriterNotifs({token,theme:t,lang}:{token:string;theme:Theme;lang:Language}){
  const[notifs,setNotifs]=useState<{id:string;title:string;body:string;type:string;is_read:boolean;url?:string;created_at:string}[]>([]);
  const[loading,setLoading]=useState(true);
  useEffect(()=>{fetchWriterNotifications(token).then(n=>setNotifs(n||[])).finally(()=>setLoading(false))},[token]);
  const markAll=async()=>{await markWriterNotificationsRead(token);setNotifs(n=>n.map(x=>({...x,is_read:true})))};
  const deleteNotif=async(id:string)=>{await deleteWriterNotification(token,id);setNotifs(n=>n.filter(x=>x.id!==id))};
  const typeIcon=(type:string)=>type==='approved'?'check-circle':type==='rejected'?'x-circle':type==='info'?'info':'bell';
  const typeColor=(type:string)=>type==='approved'?'#10B981':type==='rejected'?'#EF4444':'#6366F1';
  return <View style={{flex:1}}>
    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
      <Text style={{fontSize:16,fontWeight:'900',color:t.ink}}>{copy(lang,'notifications')}</Text>
      <View style={{flexDirection:'row',gap:8}}>
        {notifs.some(n=>!n.is_read)&&<Pressable onPress={markAll} style={{paddingHorizontal:10,paddingVertical:5,borderRadius:8,backgroundColor:t.tint}}>
          <Text style={{fontSize:11,fontWeight:'700',color:t.primary}}>{copy(lang,'markAllRead')}</Text>
        </Pressable>}
        {notifs.length>0&&<Pressable onPress={async()=>{const ids=notifs.map(n=>n.id);setNotifs([]);await Promise.all(ids.map(id=>deleteWriterNotification(token,id)))}} style={{paddingHorizontal:5,paddingVertical:5,borderRadius:8,backgroundColor:t.tint}}>
          <Feather name="trash-2" size={13} color="#EF4444"/>
        </Pressable>}
      </View>
    </View>
    {loading?<View style={{alignItems:'center',paddingVertical:40}}><ActivityIndicator color={t.primary}/></View>:
    notifs.length===0?<View style={{alignItems:'center',paddingVertical:40}}><Feather name="bell" size={28} color={t.muted}/><Text style={{fontSize:13,color:t.muted,marginTop:8}}>{copy(lang,'noNotifications')}</Text></View>:
    notifs.map(n=><View key={n.id} style={{flexDirection:'row',alignItems:'flex-start',backgroundColor:n.is_read?t.card:t.tint,borderRadius:12,padding:12,marginBottom:6,borderWidth:1,borderColor:n.is_read?t.line:t.primary+'30',borderLeftWidth:3,borderLeftColor:typeColor(n.type)}}>
      <View style={{width:30,height:30,borderRadius:8,backgroundColor:typeColor(n.type)+'18',alignItems:'center',justifyContent:'center',marginRight:10}}>
        <Feather name={typeIcon(n.type) as any} size={14} color={typeColor(n.type)}/>
      </View>
      <View style={{flex:1}}>
        <Text numberOfLines={1} style={{fontSize:13,fontWeight:'700',color:t.ink}}>{n.title}</Text>
        <Text numberOfLines={3} style={{fontSize:12,color:t.muted,marginTop:2,lineHeight:17}}>{n.body}</Text>
        <View style={{flexDirection:'row',alignItems:'center',marginTop:4}}>
          {n.url?<Pressable onPress={()=>Linking.openURL(n.url!)} style={{flexDirection:'row',alignItems:'center',marginRight:10,backgroundColor:t.primary+'15',paddingHorizontal:10,paddingVertical:5,borderRadius:8}}>
            <Feather name="external-link" size={12} color={t.primary}/>
            <Text style={{fontSize:11,fontWeight:'700',color:t.primary,marginLeft:5}}>{copy(lang,'openLink')}</Text>
          </Pressable>:null}
          <Text style={{fontSize:10,color:t.muted}}>{new Date(n.created_at).toLocaleDateString()}</Text>
        </View>
      </View>
      {!n.is_read&&<View style={{width:8,height:8,borderRadius:4,backgroundColor:t.primary,marginLeft:8,marginTop:4}}/>}
      <Pressable onPress={()=>deleteNotif(n.id)} style={{marginLeft:8,marginTop:2}}>
        <Feather name="x" size={16} color={t.muted}/>
      </Pressable>
    </View>)}
  </View>}

function Back({title,theme,onPress}:{title:string;theme:Theme;onPress:()=>void}){return <View style={styles.back}><Pressable onPress={onPress}><Feather name="arrow-left" size={22} color={theme.ink}/></Pressable><Text style={[styles.backTitle,{color:theme.ink}]}>{title}</Text><View style={{width:22}}/></View>}
function Section({title,theme,action,seeAllText}:{title:string;theme:Theme;action?:()=>void;seeAllText?:string}){return <View style={styles.section}><Text style={[styles.sectionTitle,{color:theme.ink}]}>{title}</Text>{action&&<Pressable onPress={action}><Text style={{color:theme.primary,fontWeight:'800',fontSize:12}}>{seeAllText||'See all →'}</Text></Pressable>}</View>}
function Cover({book,large}:{book:Book;large?:boolean}){return <View style={[styles.cover,large&&styles.coverLarge,{backgroundColor:book.color}]}>{book.cover_url?<><Image source={{uri:book.cover_url}} style={{position:'absolute',top:0,left:0,right:0,bottom:0,borderRadius:large?16:9}} resizeMode="cover"/><View style={{position:'absolute',top:0,left:0,right:0,bottom:0,borderRadius:large?16:9,backgroundColor:'rgba(0,0,0,0.15)'}}/></>:null}<Feather name={I(book.categoryIcon)} size={large?27:20} color={book.accent}/><Text numberOfLines={3} style={[styles.coverTitle,large&&{fontSize:17}]}>{book.title}</Text><View style={{height:2,width:24,backgroundColor:book.accent,marginVertical:7}}/><Text style={styles.coverAuthor}>{book.author}</Text></View>}
function Episode({book,theme,onPress}:{book:Book;theme:Theme;onPress:()=>void}){const c=book.chapters[book.chapters.length-1];return <Pressable onPress={onPress} style={[styles.episode,{backgroundColor:theme.card,borderColor:theme.line}]}><Cover book={book}/><View style={{flex:1}}><Text style={{color:theme.primary,fontSize:10,fontWeight:'900'}}>নতুন পর্ব</Text><Text style={[styles.rowTitle,{color:theme.ink}]}>{book.title}</Text><Text style={{color:theme.muted,fontSize:11,marginTop:4}}>পর্ব {book.chapters.length}: {c.title}</Text></View><Feather name="play-circle" size={23} color={theme.primary}/></Pressable>}
function Row({book,theme,onPress}:{book:Book;theme:Theme;onPress:()=>void}){return <Pressable onPress={onPress} style={[styles.row,{backgroundColor:theme.card,borderColor:theme.line}]}><Cover book={book}/><View style={{flex:1}}><Text style={[styles.rowTitle,{color:theme.ink}]}>{book.title}</Text><Text style={{color:theme.primary,fontSize:12,marginTop:4}}>{book.author}</Text><Text style={{color:theme.muted,fontSize:11,marginTop:4}}>◉ {book.views} • {book.category}</Text></View><Feather name="chevron-right" size={18} color={theme.muted}/></Pressable>}
function Link({title,icon,n,theme,onPress}:{title:string;icon:string;n:number;theme:Theme;onPress:()=>void}){return <Pressable onPress={onPress} style={[styles.link,{backgroundColor:theme.card,borderColor:theme.line}]}><View style={[styles.linkIcon,{backgroundColor:theme.tint}]}><Feather name={I(icon)} size={20} color={theme.primary}/></View><Text style={[styles.rowTitle,{color:theme.ink}]}>{title}</Text><Text style={{color:theme.muted,fontSize:10}}>{n}টি</Text></Pressable>}
function Menu({title,icon,theme,onPress}:{title:string;icon:string;theme:Theme;onPress:()=>void}){return <Pressable onPress={onPress} style={[styles.menu,{backgroundColor:theme.card,borderBottomColor:theme.line}]}><View style={[styles.menuIcon,{backgroundColor:theme.tint}]}><Feather name={I(icon)} size={17} color={theme.primary}/></View><Text style={[styles.rowTitle,{color:theme.ink,flex:1}]}>{title}</Text><Feather name="chevron-right" size={18} color={theme.muted}/></Pressable>}
function Toggle({title,icon,value,theme,onChange}:{title:string;icon:string;value:boolean;theme:Theme;onChange:(v:boolean)=>void}){return <View style={[styles.menu,{backgroundColor:theme.card,borderBottomColor:theme.line}]}><View style={[styles.menuIcon,{backgroundColor:theme.tint}]}><Feather name={I(icon)} size={17} color={theme.primary}/></View><Text style={[styles.rowTitle,{color:theme.ink,flex:1}]}>{title}</Text><Switch value={value} onValueChange={onChange} trackColor={{true:theme.primary}}/></View>}
function Action({icon,label,active,theme,onPress}:{icon:string;label:string;active:boolean;theme:Theme;onPress:()=>void}){return <Pressable onPress={onPress} style={{alignItems:'center',gap:5}}><View style={[styles.action,{backgroundColor:active?theme.primary:theme.card,borderColor:theme.line}]}><Feather name={I(icon)} size={17} color={active?'#fff':theme.ink}/></View><Text style={{color:active?theme.primary:theme.muted,fontSize:10,fontWeight:'800'}}>{label}</Text></Pressable>}
function Button({title,icon,disabled,onPress}:{title:string;icon:string;disabled?:boolean;onPress:()=>void}){return <Pressable disabled={disabled} onPress={onPress} style={[styles.button,disabled&&{opacity:.4}]}><Text style={styles.buttonText}>{title}</Text><Feather name={I(icon)} size={18} color="#fff"/></Pressable>}
function Empty({theme}:{theme:Theme}){return <View style={styles.empty}><Feather name="book" size={28} color={theme.primary}/><Text style={[styles.rowTitle,{color:theme.ink,marginTop:10}]}>এখানে এখনো কিছু নেই</Text><Text style={{color:theme.muted,marginTop:5}}>গল্প পড়তে শুরু করুন</Text></View>}
type ThemeId = import('./src/types').ThemeId;
const themePalettes:Record<ThemeId,{light:{dark:boolean;primary:string;bg:string;card:string;ink:string;muted:string;line:string;tint:string;reader:string};dark:{dark:boolean;primary:string;bg:string;card:string;ink:string;muted:string;line:string;tint:string;reader:string}}>={
katagolap:{light:{dark:false,primary:'#087A63',bg:'#F5FAF8',card:'#FFFFFF',ink:'#172421',muted:'#71817D',line:'#E2ECE8',tint:'#DDF5EC',reader:'#FBFCF7'},dark:{dark:true,primary:'#59C9AA',bg:'#0E1514',card:'#17211F',ink:'#F1F6F4',muted:'#91A39E',line:'#293834',tint:'#203D36',reader:'#111917'}},
sepia:{light:{dark:false,primary:'#8B6914',bg:'#FBF7F0',card:'#FFFFFF',ink:'#2C2416',muted:'#8C7E6A',line:'#E8DFD0',tint:'#F3EDE0',reader:'#FDFBF7'},dark:{dark:true,primary:'#D4A843',bg:'#1A1508',card:'#241E12',ink:'#F0E8D8',muted:'#9A8B6E',line:'#3A3220',tint:'#2E2714',reader:'#16120A'}},
midnight:{light:{dark:false,primary:'#4A6CF7',bg:'#F4F6FF',card:'#FFFFFF',ink:'#1A1F36',muted:'#6B7394',line:'#D8DDF0',tint:'#E4E8F8',reader:'#FAFBFF'},dark:{dark:true,primary:'#7B96FF',bg:'#0B0E1A',card:'#151A2E',ink:'#E8ECFF',muted:'#6B7394',line:'#262D4A',tint:'#1C2240',reader:'#0D1020'}},
godhuli:{light:{dark:false,primary:'#C05621',bg:'#FFF8F3',card:'#FFFFFF',ink:'#2D1B0E',muted:'#8C6E56',line:'#EDD8C8',tint:'#F8EDE2',reader:'#FFFCF9'},dark:{dark:true,primary:'#ED8936',bg:'#1A0F06',card:'#261A0E',ink:'#F8E8D8',muted:'#9A7E60',line:'#3A2E1E',tint:'#2E2214',reader:'#160E08'}},
sagar:{light:{dark:false,primary:'#1A7FA0',bg:'#F2FAFD',card:'#FFFFFF',ink:'#0F2B33',muted:'#5C8A96',line:'#C8E2EA',tint:'#D8EFF5',reader:'#F8FCFD'},dark:{dark:true,primary:'#38B2D6',bg:'#061218',card:'#0E1E24',ink:'#D8F0F8',muted:'#5C8A96',line:'#1E3440',tint:'#142A32',reader:'#081418'}},
oronno:{light:{dark:false,primary:'#2D7A3A',bg:'#F3FAF4',card:'#FFFFFF',ink:'#1A2E1E',muted:'#5C7A60',line:'#C8E4CC',tint:'#D8F0DA',reader:'#F8FCF9'},dark:{dark:true,primary:'#4CAF5A',bg:'#0A1A0C',card:'#142816',ink:'#D8F0DC',muted:'#5C7A60',line:'#1E3420',tint:'#162C18',reader:'#0C1C0E'}},
lavender:{light:{dark:false,primary:'#7C3AED',bg:'#F8F5FF',card:'#FFFFFF',ink:'#1E1533',muted:'#7C6E94',line:'#DDD4F0',tint:'#ECE6F8',reader:'#FCFAFF'},dark:{dark:true,primary:'#A78BFA',bg:'#120E1E',card:'#1C1530',ink:'#EDE6FF',muted:'#7C6E94',line:'#302848',tint:'#241E3C',reader:'#141020'}},
golapi:{light:{dark:false,primary:'#D94A7A',bg:'#FFF5F8',card:'#FFFFFF',ink:'#2E1520',muted:'#8C5E72',line:'#F0D0DC',tint:'#F8E2EA',reader:'#FFFAFC'},dark:{dark:true,primary:'#F472B6',bg:'#1A0C12',card:'#281520',ink:'#FFE8F0',muted:'#8C5E72',line:'#3E2430',tint:'#301C28',reader:'#1C0E14'}}};
function themeFor(themeId:ThemeId,dark:boolean){return themePalettes[themeId]?.[dark?'dark':'light']||themePalettes.katagolap[dark?'dark':'light']}
const styles=StyleSheet.create({center:{flex:1,alignItems:'center',justifyContent:'center'},logo:{width:76,height:76,borderRadius:25,backgroundColor:'#087A63',alignItems:'center',justifyContent:'center',elevation:8},brand:{fontSize:25,fontWeight:'900',marginTop:16},gate:{flex:1},art:{height:'38%',backgroundColor:'#DDF8EF',alignItems:'center',justifyContent:'center'},gateBody:{flex:1,padding:25,justifyContent:'center'},eyebrow:{fontSize:12,fontWeight:'900',letterSpacing:1},gateTitle:{fontSize:30,lineHeight:39,fontWeight:'900',marginTop:8},copy:{fontSize:14,lineHeight:22,marginVertical:14},input:{height:55,borderWidth:1,borderRadius:17,paddingHorizontal:16,fontSize:16},note:{textAlign:'center',fontSize:11,marginTop:14},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:23},title:{fontSize:25,fontWeight:'900'},feature:{height:214,borderRadius:24,padding:18,flexDirection:'row',alignItems:'center',overflow:'hidden'},tag:{color:'#F7D87D',fontSize:11,fontWeight:'900',marginBottom:10},featureTitle:{color:'#fff',fontSize:23,lineHeight:30,fontWeight:'900'},featureAuthor:{color:'#D1E6DF',fontSize:12,marginTop:5},readPill:{backgroundColor:'#F5D578',borderRadius:11,padding:11,alignSelf:'flex-start',marginTop:15},cover:{width:124,height:169,borderRadius:9,padding:11,justifyContent:'flex-end',overflow:'hidden'},coverLarge:{width:137,height:188,transform:[{rotate:'2deg'}]},coverTitle:{color:'#fff',fontWeight:'900',fontSize:14,lineHeight:18},coverAuthor:{fontSize:8,color:'#FFFFFFAA'},section:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:27,marginBottom:13},sectionTitle:{fontSize:19,fontWeight:'900'},bookName:{fontSize:14,fontWeight:'800',lineHeight:19,marginTop:9},episode:{minHeight:98,borderRadius:18,borderWidth:1,padding:10,flexDirection:'row',alignItems:'center',gap:12,marginBottom:10},row:{minHeight:100,borderRadius:18,borderWidth:1,padding:10,flexDirection:'row',alignItems:'center',gap:12,marginBottom:10},rowTitle:{fontSize:14,fontWeight:'800'},tabs:{height:76,borderTopWidth:1,flexDirection:'row',paddingTop:9},tab:{flex:1,alignItems:'center',gap:4},grid2:{flexDirection:'row',flexWrap:'wrap',gap:10},link:{width:'48.4%',borderRadius:18,borderWidth:1,padding:13},linkIcon:{width:40,height:40,borderRadius:13,alignItems:'center',justifyContent:'center',marginBottom:12},catGrid:{flexDirection:'row',flexWrap:'wrap',gap:12},catCard:{width:'47%'},catImgWrap:{borderRadius:16,overflow:'hidden',height:140},catImg:{width:'100%',height:140},catImgFallback:{width:'100%',height:140,alignItems:'center',justifyContent:'center'},catImgOverlay:{position:'absolute',bottom:0,left:0,right:0,backgroundColor:'rgba(0,0,0,0.35)',paddingVertical:8,paddingHorizontal:10},catImgName:{color:'#fff',fontSize:14,fontWeight:'900'},catBadge:{alignSelf:'flex-start',marginTop:8,borderRadius:8,paddingVertical:4,paddingHorizontal:10},catBadgeText:{fontSize:11,fontWeight:'700'},profile:{padding:15,borderRadius:20,borderWidth:1,flexDirection:'row',alignItems:'center',gap:12},avatar:{width:52,height:52,borderRadius:17,alignItems:'center',justifyContent:'center'},profileName:{fontSize:18,fontWeight:'900'},group:{fontSize:11,fontWeight:'900',letterSpacing:1,marginTop:25,marginBottom:8},menu:{minHeight:61,borderBottomWidth:1,paddingHorizontal:11,flexDirection:'row',alignItems:'center',gap:11},menuIcon:{width:37,height:37,borderRadius:12,alignItems:'center',justifyContent:'center'},languageBox:{borderWidth:1,borderRadius:18,padding:15},languageRow:{height:52,borderBottomWidth:1,flexDirection:'row',alignItems:'center',gap:12},radio:{width:20,height:20,borderRadius:10,borderWidth:2,alignItems:'center',justifyContent:'center'},radioDot:{width:10,height:10,borderRadius:5},back:{height:48,flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:18},backTitle:{fontSize:19,fontWeight:'900'},search:{height:53,borderWidth:1,borderRadius:17,paddingHorizontal:14,flexDirection:'row',alignItems:'center',gap:10},notifCard:{flexDirection:'row',gap:12,borderRadius:16,borderWidth:1,padding:14,marginBottom:10},notifIconWrap:{width:44,height:44,borderRadius:14,alignItems:'center',justifyContent:'center'},notifTitle:{fontSize:14,fontWeight:'800',flex:1,marginRight:8},notifBody:{fontSize:12,marginTop:4,lineHeight:18},notifTime:{fontSize:10,fontWeight:'700',marginTop:6},notifLiveDot:{width:8,height:8,borderRadius:4},notifLink:{flexDirection:'row',alignItems:'center',gap:3,borderWidth:1,borderRadius:6,paddingHorizontal:6,paddingVertical:2},badge:{position:'absolute',top:-5,right:-7,minWidth:18,height:18,borderRadius:9,alignItems:'center',justifyContent:'center',paddingHorizontal:4},badgeText:{color:'#fff',fontSize:10,fontWeight:'900'},detailTop:{height:245,borderRadius:21,alignItems:'center',justifyContent:'center',marginBottom:20},detailTitle:{fontSize:27,fontWeight:'900',lineHeight:35},meta:{flexDirection:'row',gap:17,marginTop:10},actions:{flexDirection:'row',justifyContent:'space-around',marginVertical:20},action:{width:43,height:43,borderRadius:14,borderWidth:1,alignItems:'center',justifyContent:'center'},button:{height:54,borderRadius:16,backgroundColor:'#087A63',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,marginTop:14},buttonText:{color:'#fff',fontWeight:'900',fontSize:15},chapter:{minHeight:66,borderBottomWidth:1,flexDirection:'row',alignItems:'center',gap:12},number:{width:38,height:38,borderRadius:12,alignItems:'center',justifyContent:'center'},comment:{height:56,borderWidth:1,borderRadius:16,marginTop:20,flexDirection:'row',alignItems:'center',gap:10,paddingHorizontal:15},readerHead:{minHeight:68,paddingHorizontal:18,borderBottomWidth:1,flexDirection:'row',alignItems:'center'},readerBody:{padding:28,paddingTop:45,paddingBottom:110},readerTitle:{fontSize:28,fontWeight:'900',textAlign:'center',marginVertical:16},readerTools:{minHeight:68,borderTopWidth:1,paddingHorizontal:18,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},writer:{backgroundColor:'#124D43',borderRadius:20,padding:20},writerTitle:{color:'#fff',fontSize:22,fontWeight:'900',marginTop:12},story:{height:180,borderWidth:1,borderRadius:17,padding:15,textAlignVertical:'top',marginVertical:12},empty:{alignItems:'center',justifyContent:'center',paddingVertical:55},profileCard:{borderRadius:22,padding:20,alignItems:'center'},avatarBig:{width:68,height:68,borderRadius:22,alignItems:'center',justifyContent:'center'},profileNameBig:{fontSize:22,fontWeight:'900',marginTop:12},profileBadge:{fontSize:12,color:'#91A39E',marginTop:2},profileStats:{flexDirection:'row',marginTop:18,backgroundColor:'rgba(0,0,0,0.04)',borderRadius:14,paddingVertical:12},profileStat:{flex:1,alignItems:'center',gap:4},profileStatNum:{fontSize:20,fontWeight:'900'},profileStatLabel:{fontSize:10,fontWeight:'700',letterSpacing:0.5},menuGroup:{borderRadius:18,overflow:'hidden',marginBottom:16},menuGroupTitle:{fontSize:11,fontWeight:'900',letterSpacing:0.8,marginBottom:8,marginLeft:4},menuItem:{minHeight:54,paddingHorizontal:14,flexDirection:'row',alignItems:'center',gap:12},menuIconBig:{width:38,height:38,borderRadius:12,alignItems:'center',justifyContent:'center'},menuSep:{height:StyleSheet.hairlineWidth,marginLeft:62},nameModal:{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'center',alignItems:'center',padding:24},nameModalBox:{width:'100%',borderRadius:22,padding:24},nameModalTitle:{fontSize:18,fontWeight:'900',marginBottom:4},nameModalHint:{fontSize:12,marginBottom:14},nameInput:{height:52,borderWidth:1.5,borderRadius:14,paddingHorizontal:16,fontSize:16,fontWeight:'700'},nameModalBtns:{flexDirection:'row',gap:10,marginTop:16},nameBtn:{flex:1,height:48,borderRadius:14,alignItems:'center',justifyContent:'center'},nameBtnText:{fontWeight:'900',fontSize:15},gateIcon:{width:120,height:120,borderRadius:30},gateTop:{},langRow2:{flexDirection:'row',gap:8,marginTop:18,justifyContent:'center'},langBtn2:{paddingHorizontal:18,paddingVertical:10,borderRadius:12,borderWidth:1.5}});
