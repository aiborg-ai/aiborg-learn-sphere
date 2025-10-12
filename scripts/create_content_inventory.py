#!/usr/bin/env python3
"""
Create Content Inventory CSV
Generates a spreadsheet-compatible CSV of all 500 articles
"""

import json
import csv

def create_content_inventory():
    """Create CSV inventory of all articles"""

    # Load articles
    with open('/home/vik/aiborg_CC/aiborg-learn-sphere/scripts/articles_with_content.json', 'r') as f:
        articles = json.load(f)

    # Create CSV
    output_file = '/home/vik/aiborg_CC/aiborg-learn-sphere/scripts/CONTENT_INVENTORY.csv'

    with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = [
            'Index',
            'Title',
            'Slug',
            'Audience',
            'Category',
            'Reading Time (min)',
            'Word Count (est)',
            'Tags',
            'Batch',
            'Meta Title',
            'Excerpt'
        ]

        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()

        for i, article in enumerate(articles, 1):
            # Calculate batch number
            batch_num = ((i - 1) // 50) + 1

            # Estimate word count from reading time
            word_count = article.get('reading_time', 5) * 200

            # Get tags as comma-separated string
            tags = ', '.join(article.get('tags', []))

            writer.writerow({
                'Index': i,
                'Title': article.get('title', ''),
                'Slug': article.get('slug', ''),
                'Audience': article.get('audience', ''),
                'Category': article.get('category', ''),
                'Reading Time (min)': article.get('reading_time', 5),
                'Word Count (est)': word_count,
                'Tags': tags,
                'Batch': f'Batch {batch_num:02d}',
                'Meta Title': article.get('meta_title', '')[:80],
                'Excerpt': article.get('excerpt', '')[:100]
            })

    print(f"✅ Content inventory created: {output_file}")
    print(f"   Total articles: {len(articles)}")
    print(f"   Columns: {len(fieldnames)}")

    # Print summary statistics
    audiences = {}
    for article in articles:
        aud = article.get('audience', 'Unknown')
        audiences[aud] = audiences.get(aud, 0) + 1

    print("\n📊 Distribution by Audience:")
    for audience, count in sorted(audiences.items()):
        print(f"   {audience}: {count} articles")

    total_words = sum(article.get('reading_time', 5) * 200 for article in articles)
    avg_reading_time = sum(article.get('reading_time', 5) for article in articles) / len(articles)

    print(f"\n📈 Content Statistics:")
    print(f"   Estimated total words: {total_words:,}")
    print(f"   Average reading time: {avg_reading_time:.1f} minutes")
    print(f"   Shortest article: {min(article.get('reading_time', 5) for article in articles)} min")
    print(f"   Longest article: {max(article.get('reading_time', 5) for article in articles)} min")

if __name__ == '__main__':
    create_content_inventory()
