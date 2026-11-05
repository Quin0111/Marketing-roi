/** @type {import('tailwindcss').Config} */
const slate = {50:'#FAF9F6',100:'#F0F1EF',200:'#DDE1E0',300:'#C3CDCF',400:'#667780',500:'#60717A',600:'#53656F',700:'#485760',800:'#35434C',900:'#35434C',950:'#485760'};
const blue = {50:'#F0F5F7',100:'#DDE7ED',200:'#B8CCD7',300:'#B8CCD7',400:'#91ADBD',500:'#607E8F',600:'#B8CCD7',700:'#485760',800:'#35434C',900:'#35434C',950:'#35434C'};
const beige = {50:'#F7F2ED',100:'#EBDDD2',200:'#EBDDD2',300:'#D7C5B7',400:'#958173',500:'#806D60',600:'#756356',700:'#6B594D',800:'#5E4E44',900:'#53483F',950:'#53483F'};
export default {
 content:['./index.html','./src/**/*.{js,ts,jsx,tsx}'], darkMode:'class',
 theme:{extend:{
  colors:{slate,blue,navy:slate,amber:beige,orange:beige,rose:beige,red:beige,emerald:blue,green:blue,teal:blue,cyan:blue,indigo:blue,purple:blue,
   canvas:'#FAF9F6',mist:'#DDE7ED',dusty:'#B8CCD7',beige:'#EBDDD2',ink:'#485760',
   brand:{indigo:'#B8CCD7',purple:'#DDE7ED',cyan:'#B8CCD7',emerald:'#B8CCD7',amber:'#EBDDD2',rose:'#EBDDD2'}},
  fontFamily:{sans:['Inter','Be Vietnam Pro','system-ui','-apple-system','BlinkMacSystemFont','Segoe UI','sans-serif']},
  borderRadius:{xl:'12px','2xl':'12px','3xl':'12px'},
  boxShadow:{card:'0 1px 2px rgb(72 87 96 / 3%)','card-hover':'0 2px 5px rgb(72 87 96 / 5%)',glow:'none',md:'0 2px 4px rgb(72 87 96 / 5%)',lg:'0 4px 12px rgb(72 87 96 / 8%)',xl:'0 6px 20px rgb(72 87 96 / 8%)'}
 }},plugins:[]
};
