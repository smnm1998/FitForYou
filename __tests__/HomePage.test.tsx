import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import HomePage from "../src/app/page";

describe("HomePage", () => {
    it("renders the main tagline", () => {
        render(<HomePage />);

        const tagline = screen.getByText(
            /내 하루와 건강을 나답게, 모든 것을 당신에게 핏하게/i
        );

        expect(tagline).toBeInTheDocument();
    });
});
