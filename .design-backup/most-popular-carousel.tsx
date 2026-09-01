// ============================================
// MOST POPULAR CAROUSEL - Save for restore after git
// Includes: MpCard, MostPopularCarousel, related styles
// ============================================

// MpCard Component (line 2330)
function MpCard({b,accent,cardW,onOpen,isBm,onToggle}:{b:Book;accent:string;cardW:number;onOpen:()=>void;isBm:boolean;onToggle:()=>void}){
  const bmScale=React.useRef(new Animated.Value(1)).current;
  const bmAnim=()=>{
    Animated.sequence([
      Animated.timing(bmScale,{toValue:0.5,duration:100,useNativeDriver:true}),
      Animated.spring(bmScale,{toValue:1,friction:3,tension:300,useNativeDriver:true})
    ]).start()
  };
  const toggleBm=()=>{bmAnim();onToggle()};
  const bookColor=b.accent||b.color||accent;
  const darker=shade(bookColor,-40);
  return <Pressable onPress={onOpen} style={{width:cardW,height:160,borderRadius:16,overflow:'hidden',position:'relative'}}>
    {b.cover_url
      ?<Image source={{uri:b.cover_url}} style={{position:'absolute',top:0,left:0,right:0,bottom:0,width:'100%',height:'100%'}} blurRadius={30} resizeMode="cover"/>
      :<View style={{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:darker}}/>}
    <View style={{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'#00000077'}}/>
    <LinearGradient colors={['#00000055',darker+'CC']} start={{x:0,y:0}} end={{x:1,y:1}} style={{position:'absolute',top:0,left:0,right:0,bottom:0}}/>
    {b.display_status&&<View style={{position:'absolute',top:0,right:0,zIndex:2,borderTopRightRadius:16,borderBottomLeftRadius:12,backgroundColor:b.display_status==='new'?'#8B5CF6CC':'#10B981CC',paddingHorizontal:10,paddingVertical:5}}><T style={{fontSize:9,fontWeight:'900',color:'#fff',letterSpacing:0.3}}>{b.display_status==='new'?'নতুন':'চলমান'}</T></View>}
    <View style={{flexDirection:'row',flex:1,padding:10}}>
      <View style={{width:85,height:128,borderRadius:10,overflow:'hidden',marginRight:10,alignSelf:'center',backgroundColor:b.color||darker}}>
        {b.cover_url
          ?<Image source={{uri:b.cover_url}} style={{width:'100%',height:'100%',borderRadius:10}} resizeMode="cover"/>
          :<View style={{flex:1,alignItems:'center',justifyContent:'center'}}><Feather name={I(b.categoryIcon||'book-open')} size={28} color={b.accent||'#fff'}/></View>}
      </View>
      <View style={{flex:1,justifyContent:'center'}}>
        <T numberOfLines={2} style={{fontSize:15,fontWeight:'800',color:'#fff',lineHeight:20,marginBottom:4}}>{b.title}</T>
        <T numberOfLines={1} style={{fontSize:11,fontWeight:'600',color:'#ffffffBB',marginBottom:7}}>{b.author}</T>
        <View style={{flexDirection:'row',alignItems:'center',gap:7,marginBottom:10}}>
          <View style={{flexDirection:'row',alignItems:'center',gap:4}}>
            <Feather name="eye" size={11} color="#ffffffBB"/>
            <T style={{fontSize:11,fontWeight:'700',color:'#ffffffDD'}}>{b.views}</T>
          </View>
          <View style={{width:3,height:3,borderRadius:1.5,backgroundColor:'#ffffff55'}}/>
          <T style={{fontSize:11,fontWeight:'600',color:'#ffffffBB'}}>{b.category||'গল্প'}</T>
          <View style={{width:3,height:3,borderRadius:1.5,backgroundColor:'#ffffff55'}}/>
          <T style={{fontSize:11,fontWeight:'600',color:'#ffffffBB'}}>{b.writer_status==='complete'?'সম্পূর্ণ':b.writer_status==='ongoing'?'ধারাবাহিক':''}</T>
        </View>
        <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
          <Pressable onPress={onOpen} style={{flex:1,backgroundColor:'#fff',borderRadius:12,height:34,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:5}}>
            <Feather name='book-open' size={13} color={darker}/>
            <T style={{fontSize:13,fontWeight:'800',color:darker}}>পড়ুন</T>
          </Pressable>
          <Animated.View style={{transform:[{scale:bmScale}]}}>
            <Pressable onPress={toggleBm} hitSlop={8} style={{width:34,height:34,borderRadius:17,borderWidth:1.5,borderColor:isBm?'#F5C660':'#ffffff44',backgroundColor:isBm?'#F5C66033':'transparent',alignItems:'center',justifyContent:'center'}}>
              <Feather name="bookmark" size={14} color={isBm?'#F5C660':'#fff'}/>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </View>
  </Pressable>
}

// MostPopularCarousel Component (line 2331)
const MostPopularCarousel=React.memo(function MostPopularCarousel({books,theme,lang,accent,onOpen,title,onSeeAll,bookmarks,onUpdate}:{books:Book[];theme:Theme;lang:Language;accent:string;onOpen:(id:string)=>void;title:string;onSeeAll:()=>void;bookmarks:string[];onUpdate:(ids:string[])=>void}){
  const scrollX=React.useRef(new Animated.Value(0)).current;
  const CARD_W=Dimensions.get('window').width-70;
  return <View style={{marginBottom:8}}>
    <View style={styles.secHead}>
      <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
        <View style={[styles.secIcon,{backgroundColor:shade(accent,-30)]}>
          <Feather name="trending-up" size={15} color="#fff"/>
        </View>
        <T style={[styles.sectionTitle,{color:theme.ink}]}>{title}</T>
      </View>
      <Pressable onPress={onSeeAll} style={[styles.seeAllPill,{backgroundColor:shade(accent,-30)}]}>
        <T style={{color:'#fff',fontWeight:'900',fontSize:13,letterSpacing:0.3}}>সব দেখুন</T>
      </Pressable>
    </View>
    <Animated.FlatList
      data={books}
      keyExtractor={(b:any)=>b.id}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      snapToInterval={CARD_W+12}
      decelerationRate="fast"
      contentContainerStyle={{paddingHorizontal:18,gap:12}}
      onScroll={Animated.event([{nativeEvent:{contentOffset:{x:scrollX}}}],{useNativeDriver:true})}
      renderItem={({item}:{item:Book})=>{
        const isBm=bookmarks.includes(item.id);
        return <MpCard b={item} accent={accent} cardW={CARD_W} onOpen={()=>onOpen(item.id)} isBm={isBm} onToggle={()=>onUpdate(isBm?bookmarks.filter(x=>x!==item.id):[...bookmarks,item.id])}/>
      }}
    />
    <View style={{flexDirection:'row',justifyContent:'center',marginTop:10,gap:5}}>
      {books.map((_:any,i:number)=>{
        const inputRange=[(CARD_W+12)*(i-1),(CARD_W+12)*i,(CARD_W+12)*(i+1)];
        const dotOp=scrollX.interpolate({inputRange,outputRange:[0.3,1,0.3],extrapolate:'clamp'});
        const dotScale=scrollX.interpolate({inputRange,outputRange:[0.7,1.3,0.7],extrapolate:'clamp'});
        return <Animated.View key={i} style={{width:4,height:4,borderRadius:2,backgroundColor:accent,opacity:dotOp,transform:[{scale:dotScale}]}}/>;
      })}
    </View>
  </View>
})

// Usage in HomeInner (line ~292):
// if(k==='mostPopular'){
//   const l=hlist('mostPopular');
//   const list=l.length?l:(books.length?[...books].sort(byViews):[]);
//   if(!list.length)return null;
//   return <MostPopularCarousel books={list.slice(0,10)} theme={p.theme} lang={p.state.settings.language} accent={AU} onOpen={(id)=>p.open(id)} title={hdtitle('mostPopular')||'সর্বাধিক জনপ্রিয়'} onSeeAll={()=>p.setScreen({type:'list',title:'সর্বাধিক জনপ্রিয়',ids:list.map(x=>x.id)})} bookmarks={p.state.bookmarks} onUpdate={(ids)=>p.update({bookmarks:ids})} />;
// }
