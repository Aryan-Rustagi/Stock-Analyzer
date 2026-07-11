const { searchStock } = require("../services/stockService");

async function getStock(req,res){ 
    try{
        const symbol=req.params.symbol;
        const stock=await searchStock(symbol);
        return res.json(stock);
    }
    catch(err){
        return res.status(500).json({message:err.message});
    }

    
}

module.exports = getStock;