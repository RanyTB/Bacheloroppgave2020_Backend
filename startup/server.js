module.exports = app => {
  if (process.env.NODE_ENV === "test") return;

  const port = process.env.PORT || 3900;
  app.listen(port, () => {
    console.log("App listening on port " + port);
  });
};
