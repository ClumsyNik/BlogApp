import "../style/Loader.css"

const Loader = () => {
  return (
    <div>
      <div
        className="bars-loader-wrapper d-flex justify-content-center align-items-center"
        style={{ height: "60vh" }}
      >
        <div className="bars-loader">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
    </div>
  );
};

export default Loader;