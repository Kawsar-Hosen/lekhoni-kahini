// ============================================
// FEATURED CARD STYLES - Save for restore after git
// ============================================

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
