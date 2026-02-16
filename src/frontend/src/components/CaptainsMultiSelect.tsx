import { useState } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import type { TeamMember } from '../backend';
import { cn } from '@/lib/utils';

interface CaptainsMultiSelectProps {
  teamMembers: TeamMember[];
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
}

export default function CaptainsMultiSelect({
  teamMembers,
  value,
  onValueChange,
  placeholder = 'Select captains...',
}: CaptainsMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedMembers = teamMembers.filter((member) =>
    value.includes(member.principal.toString())
  );

  const handleSelect = (principalStr: string) => {
    if (value.includes(principalStr)) {
      onValueChange(value.filter((v) => v !== principalStr));
    } else {
      onValueChange([...value, principalStr]);
    }
  };

  const handleRemove = (principalStr: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange(value.filter((v) => v !== principalStr));
  };

  const filteredMembers = teamMembers.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between min-h-10 h-auto"
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {selectedMembers.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selectedMembers.map((member) => (
                <Badge
                  key={member.principal.toString()}
                  variant="secondary"
                  className="mr-1"
                >
                  {member.name}
                  <button
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleRemove(member.principal.toString(), e as any);
                      }
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => handleRemove(member.principal.toString(), e)}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </Badge>
              ))
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 bg-popover text-popover-foreground border-border" align="start">
        <Command className="bg-popover">
          <CommandInput
            placeholder="Search captains..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>No team member found.</CommandEmpty>
            <CommandGroup>
              {filteredMembers.map((member) => (
                <CommandItem
                  key={member.principal.toString()}
                  value={member.principal.toString()}
                  onSelect={handleSelect}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value.includes(member.principal.toString()) ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {member.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
