const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const cors = require('cors')
const databasePath = path.join(__dirname, "ecommerce.db");
const port = process.env.PORT || 3001;
const app = express();

app.use(cors({origin:true}))
app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(port, () =>
      console.log(`Server Running at ${port}`)
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

app.get("/", async(req,res,err)=>{
    const getProductsQuery = `SELECT * FROM products`
    const allProducts = await db.all(getProductsQuery)
    res.json(allProducts)
})

const hasAllProperties = reqestQuery=>{
    const {brand,priceMin,priceMax,color,rating,order} = reqestQuery 
    return (
       order !== undefined && brand !== undefined && priceMin !== undefined && priceMax !== undefined && color !== undefined && rating !== undefined
    )
}

const hasBrandProperty = requestQuery=>{
    return requestQuery.brand !== undefined
}
const hasPriceProperty =requestQuery=>{
    return requestQuery.priceMin !== undefined && requestQuery.priceMax !== undefined;
}

const hasColorProperty=requestQuery=>{
    return requestQuery.color !== undefined
}
 
const hasRatingProperty = requestQuery=>{
    return requestQuery.rating !== undefined
} 

app.get("/products/", async(req,res,err)=>{
    let data = null;
    let getProductsQuery = '';
    const {search='',brand,priceMin=0,priceMax=150000,color,rating,order='ASC',limit=20} = req.query;
    try{
        switch(true){
            case hasAllProperties(req.query):
                getProductsQuery=`
                SELECT 
                    * 
                FROM 
                    products
                WHERE 
                    name LIKE '%${search}%' AND
                    brand LIKE '%${brand}%' AND
                    price BETWEEN ${priceMin} AND ${priceMax}
                    AND color LIKE '%${color}%'
                    AND rating = ${rating}
                ORDER BY name ${order}`
                
                break;
            case hasBrandProperty(req.query):
                getProductsQuery =`
                SELECT
                    *
                FROM
                    products
                WHERE
                    name LIKE '%${search}%' AND
                    brand LIKE '%${brand}%'
                `
                break;
            case hasPriceProperty(req.query):
                getProductsQuery =`
                SELECT
                    *
                FROM
                    products
                WHERE
                    name LIKE '%${search}%' AND
                    price BETWEEN ${priceMin} AND ${priceMax}
                ORDER BY price ${order}
                LIMIT ${limit}`
                break;
            case hasColorProperty(req.query):
                getProductsQuery =`
                SELECT
                    *
                FROM
                    products
                WHERE
                    name LIKE '%${search}%' AND 
                    color LIKE '%${color}%'
                ORDER BY price ${order}
                LIMIT ${limit}`
                break;
            case hasRatingProperty(req.query):
                getProductsQuery =`
                SELECT
                    *
                FROM
                    products
                WHERE
                    name LIKE '%${search}%' AND
                    rating =${rating}
                `
                break;
            default:
                getProductsQuery=`
                SELECT
                    *
                FROM
                    products
                WHERE
                    name LIKE '%${search}%'`
        }
        
        data = await db.all(getProductsQuery)
        res.json(data)

    }catch(err){
        console.error(err.message)
        res.json({error:`${err.message}`})
    }

    
})

app.post("/post/",async(req,res,err)=>{
    const {name,brand,price,color,rating,imageUrl} = req.body
    try {
        const getNameQuery = `
        SELECT * FROM products WHERE name = '${name}'`
        const dbUser = await db.get(getNameQuery)
        if (dbUser === undefined){
            const addProductQuery = `
            INSERT INTO products(name,brand,price,color,rating,image_url)
            VALUES('${name}','${brand}',${price},'${color}',${rating},'${imageUrl}')`
            const newProduct = await db.run(addProductQuery)
            console.log(newProduct)
            res.json('Product Added Successfully')
        }else{
            res.json({error:'this product already added'})
        }
    }catch(err){
        console.log(err.message)
        res.json({error:'Unable to post data'})
    }
})

module.exports = app;