import React from 'react';
import { Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type LanguageSelectorProps = {
  onChange: (value: string) => void;
  defaultValue?: string;
};

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ onChange, defaultValue = "en" }) => {
  return (
    <div className="flex items-center">
      <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
      <Select 
        defaultValue={defaultValue}
        onValueChange={onChange}
      >
        <SelectTrigger id="language" className="w-[130px] bg-transparent border-none focus:ring-0 focus-visible:ring-0 px-2">
          <SelectValue placeholder="Language" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="es">Español</SelectItem>
          <SelectItem value="hi">हिन्दी</SelectItem>
          <SelectItem value="ta">தமிழ்</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default LanguageSelector;
