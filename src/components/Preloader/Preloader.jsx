import React from "react";
import "./Preloader.less";

const Preloader = () => {
  return (
    <div className="preloader-container">
      <div className="preloader">
        <div className="progress-bar">
          <div className="progress-bar-fill"></div>
        </div>
      </div>
    </div>
  );
};

export default Preloader;
