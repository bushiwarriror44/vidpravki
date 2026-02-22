import { useState, useEffect, useRef } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import UserRoutes from "./Routes/UserRoutes/UserRoutes";
import Preloader from "./components/Preloader/Preloader";
import GlobalStore from "./Stores/GlobalStore/GlobalStore";
import { Navigation } from "./components/Navigation/Navigation";


const AppContent = () => {
  const { isShowOverlay, overlayOnClick, fetchSettings } = GlobalStore();
  const [Loading, SetLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const floatWarningRef = useRef(null);
  const loadStartTimeRef = useRef(Date.now());

  useEffect(() => {
    
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    const handleLoad = () => {
      if (document.readyState === "complete") {
        const elapsedTime = Date.now() - loadStartTimeRef.current;
        const minDisplayTime = 1000;
        
        if (elapsedTime < minDisplayTime) {
        setTimeout(() => {
          SetLoading(false);
          }, minDisplayTime - elapsedTime);
        } else {
          SetLoading(false);
        }
      }
    };

    if (document.readyState === "complete") {
      handleLoad();
    } else {
      window.addEventListener("load", handleLoad);
      return () => window.removeEventListener("load", handleLoad);
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handleOverlayClick = () => {
    if (overlayOnClick && typeof overlayOnClick === "function") {
      overlayOnClick();
    }
  };

  if (Loading) {
    return <Preloader />;
  }

  return (
    <>
      <Navigation />
      <Routes>
        <Route path="/*" element={<UserRoutes />} />
      </Routes>

      <div
        className={`overlayFullScreen ${isShowOverlay && "active"}`}
        onClick={handleOverlayClick}
      ></div>

     
    </>
  );
};

export default AppContent;
