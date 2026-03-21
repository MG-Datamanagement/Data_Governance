import { InfoIcon } from "lucide-react";

interface InfoIconTooltipProps {
    text: string;
    size?: number;
    className?: string;
    iconColor?: string;
}

export const InfoIconTooltip = ({ text, size = 14, className, iconColor }: InfoIconTooltipProps) => {
    return (
        <div title={text} className={className}>
            <InfoIcon size={size} />
        </div>
    );
};