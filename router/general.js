const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

// Função para obter a lista de livros (Task 10)
async function getBooks() {
  try {
    const response = await axios.get('https://goncalodamas-5000.theianext-0-labs-prod-misc-tools-us-east-0.proxy.cognitiveclass.ai/');  // Substitua com seu endpoint real
    return response.data;  // Retorna os dados da resposta
  } catch (error) {
    console.error("Erro ao buscar os livros:", error.message);
    return [];  // Retorna um array vazio se ocorrer erro
  }
}

// Rota para registro de usuários (não implementado)
public_users.post("/register", (req, res) => {
  return res.status(300).json({ message: "Yet to be implemented" });
});

// Rota para obter a lista de livros disponíveis na loja (Task 10)
public_users.get('/', async function (req, res) {
  try {
    const booksList = await getBooks();  // Chama a função para obter livros
    return res.json(booksList);  // Retorna a lista de livros
  } catch (error) {
    return res.status(500).json({ message: "Erro ao obter a lista de livros." });
  }
});

// Rota para obter detalhes de um livro com base no ISBN (Task 11)
public_users.get('/isbn/:isbn', function (req, res) {
  const isbn = req.params.isbn;
  const book = books[isbn];

  if (book) {
    res.json(book);  // Retorna os detalhes do livro
  } else {
    res.status(404).json({ message: "Livro não encontrado" });  // Livro não encontrado
  }
});

// Rota para obter detalhes de livros com base no autor (Task 12)
public_users.get('/author/:author', function (req, res) {
  const author = req.params.author.toLowerCase();  // Converte para minúsculas para comparar
  const result = [];

  Object.keys(books).forEach(isbn => {
    const book = books[isbn];
    if (book.author.toLowerCase() === author) {
      result.push(book);  // Adiciona o livro à lista de resultados
    }
  });

  if (result.length > 0) {
    res.json(result);  // Retorna os livros encontrados
  } else {
    res.status(404).json({ message: `Nenhum livro encontrado para o autor: ${author}` });
  }
});

// Rota para obter livros com base no título (Task 13)
public_users.get('/title/:title', async function (req, res) {
  const title = req.params.title.toLowerCase();  // Captura o título e converte para minúsculas
  const result = [];

  try {
    Object.keys(books).forEach(isbn => {
      const book = books[isbn];
      if (book.title.toLowerCase().includes(title)) {
        result.push(book);  // Adiciona o livro ao resultado
      }
    });

    if (result.length > 0) {
      res.json(result);  // Retorna os livros encontrados
    } else {
      res.status(404).json({ message: `Nenhum livro encontrado para o título: ${title}` });
    }
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar os livros." });
  }
});

// Rota para obter resenhas de um livro com base no ISBN
public_users.get('/review/:isbn', function (req, res) {
  const isbn = req.params.isbn;
  const book = books[isbn];

  if (book) {
    const reviews = book.reviews;

    if (Object.keys(reviews).length > 0) {
      res.json(reviews);  // Retorna as resenhas do livro
    } else {
      res.status(404).json({ message: "Nenhuma resenha encontrada para este livro" });
    }
  } else {
    res.status(404).json({ message: "Livro não encontrado" });
  }
});

// Exportando o roteador para uso em outras partes da aplicação
module.exports.general = public_users;
