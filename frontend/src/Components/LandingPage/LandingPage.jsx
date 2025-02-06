import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const LandingPage = () => {
  return (
    <div className="flex justify-center items-center min-h-screen w-screen bg-[#0b1c42]">
      <Card className="p-10 text-center w-[400px] shadow-xl bg-white rounded-2xl">
        <h1 className="text-4xl font-bold text-[#1d3557]">
          aro<span className="text-[#457b9d]">➝</span>
        </h1>
        <p className="text-gray-600 text-sm mt-2 mb-6">
          Let us point you in the right direction
        </p>
        <CardContent className="flex flex-col items-center gap-4">
          <Button asChild className="w-full text-lg py-3">
            <Link to="/login">Login →</Link>
          </Button>
          <span className="text-[#457b9d] text-sm">or</span>
          <Button asChild variant="outline" className="w-full text-lg py-3">
            <Link to="/signup">Sign Up →</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default LandingPage;






