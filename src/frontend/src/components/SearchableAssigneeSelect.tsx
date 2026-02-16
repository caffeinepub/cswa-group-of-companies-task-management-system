import { useState, useMemo } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TeamMember } from '../backend';

interface SearchableAssigneeSelectProps {
  teamMembers: TeamMember[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

export default function SearchableAssigneeSelect({
  teamMembers,
  value,
  onValueChange,
  placeholder = 'Select team member',
  required = false,
}: SearchableAssigneeSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Find selected member
  const selectedMember = useMemo(() => {
    return teamMembers.find((m) => m.principal.toString() === value);
  }, [teamMembers, value]);

  // Filter team members based on search query
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) {
      return teamMembers;
    }
    const query = searchQuery.toLowerCase();
    return teamMembers.filter((member) =>
      member.name.toLowerCase().includes(query)
    );
  }, [teamMembers, searchQuery]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedMember ? selectedMember.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 bg-popover text-popover-foreground border-border" align="start">
        <Command className="bg-popover">
          <CommandInput
            placeholder="Search assignee..."
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
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? '' : currentValue);
                    setOpen(false);
                    setSearchQuery('');
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === member.principal.toString() ? 'opacity-100' : 'opacity-0'
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
