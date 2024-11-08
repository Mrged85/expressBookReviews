const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;
const books = require('./router/booksdb.js');  // Import the books data
const users = {};  // Initialize users object to store user details (for simplicity)

const app = express();

// Middleware para permitir o uso do corpo das requisições
app.use(express.json());

// Configuração de sessão para "/customer"
app.use(session({
  secret: "fingerprint_customer",
  resave: true,
  saveUninitialized: true
}));

// Middleware de autenticação para todas as rotas que requerem login
app.use("/customer/auth/*", function auth(req, res, next) {
  const accessToken = req.session ? req.session.accessToken : null;
  const token = accessToken || req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ message: "Access denied. Token not provided." });
  }

  if (tokenIsValid(token)) {
    next(); // Continuar se o token for válido
  } else {
    res.status(403).json({ message: "Invalid or expired token." });
  }
});

// Função para validar o token JWT
function tokenIsValid(token) {
  try {
    jwt.verify(token, "your-jwt-secret");
    return true;
  } catch (error) {
    return false;
  }
}

// Rota para obter todos os livros
app.get('/', function (req, res) {
  res.send(JSON.stringify(books, null, 2));
});

// Rota para obter um livro por ISBN
app.get('/isbn/:isbn', function (req, res) {
  const isbn = req.params.isbn;
  const book = books[isbn];

  if (book) {
    res.json(book);
  } else {
    res.status(404).json({ message: "Book not found" });
  }
});

// Rota para obter livros por autor
app.get('/author/:author', function (req, res) {
  const author = req.params.author;
  const result = [];

  Object.keys(books).forEach(isbn => {
    const book = books[isbn];
    if (book.author.toLowerCase() === author.toLowerCase()) {
      result.push(book);
    }
  });

  if (result.length > 0) {
    res.json(result);
  } else {
    res.status(404).json({ message: `No books found for author: ${author}` });
  }
});

// Rota para obter livros por título
app.get('/title/:title', function (req, res) {
  const title = req.params.title;
  const result = [];

  Object.keys(books).forEach(isbn => {
    const book = books[isbn];
    if (book.title.toLowerCase().includes(title.toLowerCase())) {
      result.push(book);
    }
  });

  if (result.length > 0) {
    res.json(result);
  } else {
    res.status(404).json({ message: `No books found for title: ${title}` });
  }
});

// Rota para obter resenhas de um livro por ISBN
app.get('/review/:isbn', function (req, res) {
  const isbn = req.params.isbn;
  const book = books[isbn];

  if (book) {
    const reviews = book.reviews;

    if (Object.keys(reviews).length > 0) {
      res.json(reviews);
    } else {
      res.status(404).json({ message: "No reviews found for this book" });
    }
  } else {
    res.status(404).json({ message: "Book not found" });
  }
});

// Rota para registrar um usuário
app.post('/register', function (req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  if (users[username]) {
    return res.status(400).json({ message: "Username already exists." });
  }

  users[username] = { password };
  res.json({ message: "User registered successfully." });
});

// Rota para logar um usuário
app.post('/login', function (req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  const user = users[username];

  if (!user || user.password !== password) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  const accessToken = jwt.sign({ username }, "your-jwt-secret", { expiresIn: '1h' });
  req.session.username = username;
  req.session.accessToken = accessToken;

  res.json({ message: "Login successful", accessToken });
});

// Rota para adicionar ou modificar uma resenha de livro
app.post('/auth/review/:isbn', function (req, res) {
  const isbn = req.params.isbn;
  const { reviewText, rating } = req.body;
  const username = req.session.username;

  if (!username) {
    return res.status(401).json({ message: "User must be logged in to post a review." });
  }

  if (!reviewText || !rating) {
    return res.status(400).json({ message: "Review text and rating are required." });
  }

  const book = books[isbn];
  if (!book) {
    return res.status(404).json({ message: "Book not found." });
  }

  const reviewKey = `review_${username.toLowerCase()}`;
  
  // Se uma resenha já existe, modifica-a
  book.reviews[reviewKey] = {
    user: username,
    reviewText: reviewText,
    rating: rating
  };

  res.json({ message: "Review added or updated successfully." });
});

// Rota para excluir uma resenha de livro
app.delete('/auth/review/:isbn', function (req, res) {
    const isbn = req.params.isbn;
    const username = req.session.username;
  
    if (!username) {
      return res.status(401).json({ message: "User must be logged in to delete a review." });
    }
  
    const book = books[isbn];
    if (!book) {
      return res.status(404).json({ message: "Book not found." });
    }
  
    const reviewKey = `review_${username.toLowerCase()}`;
  
    if (book.reviews && book.reviews[reviewKey]) {
      delete book.reviews[reviewKey];
      res.json({ message: "Review deleted successfully." });
    } else {
      res.status(404).json({ message: "Review not found for this user." });
    }
  });
  

// Iniciando o servidor na porta 5000
const PORT = 5000;
app.use("/customer", customer_routes);
app.use("/", genl_routes);

app.listen(PORT, () => console.log("Server is running"));
