import { Routes, Route } from "react-router-dom";

import ShipmentsPage from "../../UserPages/ShipmentsPage/ShipmentsPage.jsx";
import WholesalePage from "../../UserPages/WholesalePage/WholesalePage.jsx";
import PromotionsPage from "../../UserPages/PromotionsPage/PromotionsPage.jsx";

import Page404 from "../../components/Page404/Page404.jsx";


const UserRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<ShipmentsPage />} />
      <Route path="/wholesale" element={<WholesalePage />} />
      <Route path="/promotions" element={<PromotionsPage />} />
      
      <Route path="/*" element={<Page404 />} />
    </Routes>
  );
};

export default UserRoutes;

