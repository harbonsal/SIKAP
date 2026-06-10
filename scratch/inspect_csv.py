import csv

def inspect():
    with open('upload_biodata.csv', mode='r', encoding='utf-8-sig', errors='ignore') as f:
        reader = csv.reader(f)
        for i, row in enumerate(reader):
            # Check row 565-570
            if 560 <= i <= 575:
                print(f"Row {i+1}: {row[:4]}")
            if any("FAIZHARIZ" in str(cell).upper() for cell in row):
                print(f"FOUND FAIZHARIZ AT ROW {i+1}: {row}")

if __name__ == "__main__":
    inspect()
