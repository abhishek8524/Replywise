import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { fadeIn, slideIn } from '../../app.animations';

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatDividerModule],
  templateUrl: './about-page.component.html',
  styleUrl: './about-page.component.scss',
  animations: [fadeIn, slideIn]
})
export class AboutPageComponent {
  visible = input.required<boolean>();
  close = output<void>();

  teamMembers = [
    {
      name: 'Abhishek',
      role: 'CS @ Sheridan',
      linkedin: 'https://www.linkedin.com/in/abhishek8524/'
    },
    {
      name: 'Gamze Esen Erdemir',
      role: '@ OntarioTechUni',
      linkedin: 'https://www.linkedin.com/in/gamze-esen-erdemir/'
    },
    {
      name: 'Oluwanifemi',
      role: '@ OntarioTechUni',
      linkedin: 'https://www.linkedin.com/in/nifemi-toluhi/'
    }
  ];

  onClose(): void {
    this.close.emit();
  }
}
