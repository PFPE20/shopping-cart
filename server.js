const express = require('express');
const products = require('./database/products.json');
const path = require('path');
const fs = require('fs');
const { error } = require('console');
const { ifError } = require('assert');
const app = express();

const productsFilePath = path.join(__dirname, 'database', 'products.json');

app.use(express.static(path.join(__dirname, 'public')))
  .use(express.json());

app.get('/products', (req, res) => {
  res.json(products);
})
  .put('/products', (req, res) => {
    const productsAct = req.body;

    let actDatabase = `[  
  {
    "id": 1,
    "name": "Producto X",
    "price": 2.5,
    "stock": ${productsAct[0]}
  },
  {
    "id": 2,
    "name": "Producto Y",
    "price": 3,
    "stock": ${productsAct[1]}
  },
  {
    "id": 3,
    "name": "Producto Z",
    "price": 2.5,
    "stock": ${productsAct[2]}
  },
  {
    "id": 4,
    "name": "Producto B",
    "price": 3.5,
    "stock": ${productsAct[3]}
  }
]`;

    try {
      fs.writeFile(productsFilePath, actDatabase, 'utf-8', (err) => {
        if (err) {
          console.log('Falló al actualizar el archivo.', err);
        }
        return;
      });
    } catch (e) {
      console.error('Error de parseado o recibiendo el body', e);
      throw new Error("Error de parseado");
    }
    res.status(200).send(console.log('¡Stock actualizado con éxito!'));
  });

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`The server is listening at http://localhost:${PORT}`);
});