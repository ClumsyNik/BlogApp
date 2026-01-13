import "./App.css";
import "bootstrap/dist/css/bootstrap.css";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store";
import MainRoutes from "./MainRoutes";

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <MainRoutes />
      </BrowserRouter>
    </Provider>
  );
}

export default App;
